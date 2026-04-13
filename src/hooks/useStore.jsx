import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import storage from '../lib/storage.js';
import SEED_PARTNERS from '../lib/partners.js';

const StoreContext = createContext(null);

// --- Server API helpers ---

function getServerConfig() {
  const url = storage.get('serverUrl', '');
  const apiKey = storage.get('serverApiKey', '');
  return { url: url ? url.replace(/\/+$/, '') : '', apiKey };
}

async function apiFetch(path, options = {}) {
  const { url, apiKey } = getServerConfig();
  if (!url) return null;

  const res = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json();
}

// Fire-and-forget: log errors but don't throw
function apiFireAndForget(path, options = {}) {
  apiFetch(path, options).catch((e) => {
    console.warn('[server sync]', e.message);
  });
}

// --- Local data loading (fallback) ---

function loadPartners() {
  const saved = storage.get('partners');
  if (saved && Array.isArray(saved) && saved.length > 0) return saved;
  storage.set('partners', SEED_PARTNERS);
  return SEED_PARTNERS;
}

function loadSettings() {
  return storage.get('settings', { apiKey: '' });
}

export function StoreProvider({ children }) {
  const [partners, setPartners] = useState(loadPartners);
  const [settings, setSettings] = useState(loadSettings);
  const [isServerMode, setIsServerMode] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);

  // Ref to track whether an update came from SSE (to avoid re-triggering API calls)
  const sseUpdateRef = useRef(false);
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // --- SSE Connection ---

  const connectSSE = useCallback((serverUrl) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (!serverUrl) return;

    const url = serverUrl.replace(/\/+$/, '');
    const es = new EventSource(`${url}/api/events`);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setServerConnected(true);
      console.log('[SSE] Connected');
    });

    es.addEventListener('partner-updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        sseUpdateRef.current = true;

        if (data.deleted) {
          // Remove partner
          setPartners((prev) => {
            const next = prev.filter((p) => p.id !== data.id);
            storage.set('partners', next);
            return next;
          });
        } else {
          // Upsert partner
          setPartners((prev) => {
            const idx = prev.findIndex((p) => p.id === data.id);
            let next;
            if (idx >= 0) {
              next = [...prev];
              next[idx] = { ...next[idx], ...data };
            } else {
              next = [...prev, data];
            }
            storage.set('partners', next);
            return next;
          });
        }

        // Reset the flag after the state update tick
        setTimeout(() => { sseUpdateRef.current = false; }, 0);
      } catch (err) {
        console.warn('[SSE] partner-updated parse error:', err);
      }
    });

    es.addEventListener('settings-updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        sseUpdateRef.current = true;
        setSettings((prev) => {
          const next = { ...prev, ...data };
          storage.set('settings', next);
          return next;
        });
        setTimeout(() => { sseUpdateRef.current = false; }, 0);
      } catch (err) {
        console.warn('[SSE] settings-updated parse error:', err);
      }
    });

    es.addEventListener('bulk-sync', () => {
      // Refetch all partners from server
      const { apiKey } = getServerConfig();
      fetch(`${url}/api/partners`, {
        headers: { 'X-API-Key': apiKey },
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            sseUpdateRef.current = true;
            setPartners(data);
            storage.set('partners', data);
            setTimeout(() => { sseUpdateRef.current = false; }, 0);
          }
        })
        .catch((err) => console.warn('[SSE] bulk-sync refetch error:', err));
    });

    es.onerror = () => {
      setServerConnected(false);
      es.close();
      eventSourceRef.current = null;
      // Reconnect after 3 seconds
      reconnectTimerRef.current = setTimeout(() => {
        console.log('[SSE] Reconnecting...');
        connectSSE(serverUrl);
      }, 3000);
    };
  }, []);

  // --- Server connect/disconnect ---

  const connectToServer = useCallback(async (serverUrl, serverApiKey) => {
    // Save config
    storage.set('serverUrl', serverUrl);
    storage.set('serverApiKey', serverApiKey);

    const url = serverUrl.replace(/\/+$/, '');

    try {
      // Fetch partners
      const partnersRes = await fetch(`${url}/api/partners`, {
        headers: { 'X-API-Key': serverApiKey },
      });
      if (!partnersRes.ok) throw new Error(`Partners fetch: ${partnersRes.status}`);
      const serverPartners = await partnersRes.json();

      // Fetch settings
      const settingsRes = await fetch(`${url}/api/settings`, {
        headers: { 'X-API-Key': serverApiKey },
      });
      if (!settingsRes.ok) throw new Error(`Settings fetch: ${settingsRes.status}`);
      const serverSettings = await settingsRes.json();

      // Update local state
      if (Array.isArray(serverPartners) && serverPartners.length > 0) {
        setPartners(serverPartners);
        storage.set('partners', serverPartners);
      }

      if (serverSettings && typeof serverSettings === 'object') {
        setSettings((prev) => {
          const next = { ...prev, ...serverSettings };
          storage.set('settings', next);
          return next;
        });
      }

      setIsServerMode(true);
      connectSSE(serverUrl);
      return { success: true };
    } catch (e) {
      console.error('[server] Connect failed:', e);
      setIsServerMode(false);
      setServerConnected(false);
      return { success: false, error: e.message };
    }
  }, [connectSSE]);

  const disconnectFromServer = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    storage.remove('serverUrl');
    storage.remove('serverApiKey');
    setIsServerMode(false);
    setServerConnected(false);
  }, []);

  const syncNow = useCallback(async () => {
    const { url, apiKey } = getServerConfig();
    if (!url) return;

    try {
      const partnersRes = await fetch(`${url}/api/partners`, {
        headers: { 'X-API-Key': apiKey },
      });
      if (partnersRes.ok) {
        const data = await partnersRes.json();
        if (Array.isArray(data)) {
          setPartners(data);
          storage.set('partners', data);
        }
      }

      const settingsRes = await fetch(`${url}/api/settings`, {
        headers: { 'X-API-Key': apiKey },
      });
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings((prev) => {
          const next = { ...prev, ...data };
          storage.set('settings', next);
          return next;
        });
      }
    } catch (e) {
      console.warn('[syncNow] error:', e.message);
    }
  }, []);

  // --- On mount: auto-connect if server config exists ---

  useEffect(() => {
    const { url, apiKey } = getServerConfig();
    if (url && apiKey) {
      connectToServer(url, apiKey);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- CRUD (unchanged API, but now syncs to server) ---

  const addPartner = useCallback((partner) => {
    const newPartner = {
      ...partner,
      id: `p-${Date.now()}`,
      pipelineStage: partner.pipelineStage || 'identified',
      interactions: [],
      agreementStatus: 'not-started',
      archived: false,
      notCompatible: false,
      createdAt: new Date().toISOString(),
    };
    setPartners((prev) => {
      const next = [...prev, newPartner];
      storage.set('partners', next);
      return next;
    });

    // Sync to server
    if (isServerMode) {
      apiFireAndForget('/api/partners', {
        method: 'POST',
        body: JSON.stringify(newPartner),
      });
    }

    return newPartner;
  }, [isServerMode]);

  const updatePartner = useCallback((id, updates) => {
    setPartners((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      storage.set('partners', next);
      return next;
    });

    // Sync to server (unless this was triggered by SSE)
    if (isServerMode && !sseUpdateRef.current) {
      apiFireAndForget(`/api/partners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    }
  }, [isServerMode]);

  const archivePartner = useCallback((id) => {
    updatePartner(id, { archived: true });
  }, [updatePartner]);

  const unarchivePartner = useCallback((id) => {
    updatePartner(id, { archived: false });
  }, [updatePartner]);

  const deletePartner = useCallback((id) => {
    setPartners((prev) => {
      const next = prev.filter((p) => p.id !== id);
      storage.set('partners', next);
      return next;
    });

    if (isServerMode) {
      apiFireAndForget(`/api/partners/${id}`, { method: 'DELETE' });
    }
  }, [isServerMode]);

  const markNotCompatible = useCallback((id) => {
    updatePartner(id, { notCompatible: true, pipelineStage: 'dead' });
  }, [updatePartner]);

  const markAsActive = useCallback((id) => {
    updatePartner(id, { notCompatible: false, archived: false });
  }, [updatePartner]);

  // Interactions
  const addInteraction = useCallback((partnerId, interaction) => {
    const newInteraction = {
      ...interaction,
      id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: interaction.date || new Date().toISOString(),
    };
    setPartners((prev) => {
      const next = prev.map((p) =>
        p.id === partnerId
          ? { ...p, interactions: [...p.interactions, newInteraction] }
          : p
      );
      storage.set('partners', next);

      // Sync the full partner to server
      if (isServerMode && !sseUpdateRef.current) {
        const updated = next.find((p) => p.id === partnerId);
        if (updated) {
          apiFireAndForget(`/api/partners/${partnerId}`, {
            method: 'PUT',
            body: JSON.stringify(updated),
          });
        }
      }

      return next;
    });
    return newInteraction;
  }, [isServerMode]);

  const updateInteraction = useCallback((partnerId, interactionId, updates) => {
    setPartners((prev) => {
      const next = prev.map((p) =>
        p.id === partnerId
          ? {
            ...p,
            interactions: p.interactions.map((i) =>
              i.id === interactionId ? { ...i, ...updates } : i
            ),
          }
          : p
      );
      storage.set('partners', next);

      if (isServerMode && !sseUpdateRef.current) {
        const updated = next.find((p) => p.id === partnerId);
        if (updated) {
          apiFireAndForget(`/api/partners/${partnerId}`, {
            method: 'PUT',
            body: JSON.stringify(updated),
          });
        }
      }

      return next;
    });
  }, [isServerMode]);

  const deleteInteraction = useCallback((partnerId, interactionId) => {
    setPartners((prev) => {
      const next = prev.map((p) =>
        p.id === partnerId
          ? { ...p, interactions: p.interactions.filter((i) => i.id !== interactionId) }
          : p
      );
      storage.set('partners', next);

      if (isServerMode && !sseUpdateRef.current) {
        const updated = next.find((p) => p.id === partnerId);
        if (updated) {
          apiFireAndForget(`/api/partners/${partnerId}`, {
            method: 'PUT',
            body: JSON.stringify(updated),
          });
        }
      }

      return next;
    });
  }, [isServerMode]);

  // Pipeline
  const movePipelineStage = useCallback((partnerId, stage) => {
    updatePartner(partnerId, { pipelineStage: stage });
  }, [updatePartner]);

  // Bulk ops
  const bulkMoveStage = useCallback((ids, stage) => {
    setPartners((prev) => {
      const idSet = new Set(ids);
      const next = prev.map((p) => (idSet.has(p.id) ? { ...p, pipelineStage: stage } : p));
      storage.set('partners', next);

      if (isServerMode) {
        const updated = next.filter((p) => idSet.has(p.id));
        apiFireAndForget('/api/partners/bulk', {
          method: 'POST',
          body: JSON.stringify(updated),
        });
      }

      return next;
    });
  }, [isServerMode]);

  const bulkMoveWave = useCallback((ids, wave) => {
    setPartners((prev) => {
      const idSet = new Set(ids);
      const next = prev.map((p) => (idSet.has(p.id) ? { ...p, wave } : p));
      storage.set('partners', next);

      if (isServerMode) {
        const updated = next.filter((p) => idSet.has(p.id));
        apiFireAndForget('/api/partners/bulk', {
          method: 'POST',
          body: JSON.stringify(updated),
        });
      }

      return next;
    });
  }, [isServerMode]);

  const bulkArchive = useCallback((ids) => {
    setPartners((prev) => {
      const idSet = new Set(ids);
      const next = prev.map((p) => (idSet.has(p.id) ? { ...p, archived: true } : p));
      storage.set('partners', next);

      if (isServerMode) {
        const updated = next.filter((p) => idSet.has(p.id));
        apiFireAndForget('/api/partners/bulk', {
          method: 'POST',
          body: JSON.stringify(updated),
        });
      }

      return next;
    });
  }, [isServerMode]);

  // Agreement
  const updateAgreementStatus = useCallback((partnerId, status) => {
    updatePartner(partnerId, { agreementStatus: status });
  }, [updatePartner]);

  // Queries
  const getPartnersByStage = useCallback(
    (stage) => partners.filter((p) => p.pipelineStage === stage),
    [partners]
  );

  const getPartnersByCategory = useCallback(
    (cat) => partners.filter((p) => p.category === cat),
    [partners]
  );

  const getPartnersByWave = useCallback(
    (wave) => partners.filter((p) => p.wave === wave),
    [partners]
  );

  const getOverdueFollowups = useCallback(() => {
    const now = new Date();
    return partners.filter((p) => {
      if (p.archived || p.notCompatible) return false;
      return p.interactions.some((i) => {
        if (!i.nextActionDue) return false;
        return new Date(i.nextActionDue) < now;
      });
    });
  }, [partners]);

  const getActivePartners = useCallback(
    () => partners.filter((p) => !p.archived),
    [partners]
  );

  // Settings
  const updateSettings = useCallback((data) => {
    setSettings((prev) => {
      const next = { ...prev, ...data };
      storage.set('settings', next);
      return next;
    });

    if (isServerMode && !sseUpdateRef.current) {
      apiFireAndForget('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  }, [isServerMode]);

  const value = useMemo(
    () => ({
      partners,
      settings,
      isServerMode,
      serverConnected,
      addPartner,
      updatePartner,
      archivePartner,
      unarchivePartner,
      deletePartner,
      markNotCompatible,
      markAsActive,
      addInteraction,
      updateInteraction,
      deleteInteraction,
      movePipelineStage,
      bulkMoveStage,
      bulkMoveWave,
      bulkArchive,
      updateAgreementStatus,
      getPartnersByStage,
      getPartnersByCategory,
      getPartnersByWave,
      getOverdueFollowups,
      getActivePartners,
      updateSettings,
      connectToServer,
      disconnectFromServer,
      syncNow,
    }),
    [
      partners,
      settings,
      isServerMode,
      serverConnected,
      addPartner,
      updatePartner,
      archivePartner,
      unarchivePartner,
      deletePartner,
      markNotCompatible,
      markAsActive,
      addInteraction,
      updateInteraction,
      deleteInteraction,
      movePipelineStage,
      bulkMoveStage,
      bulkMoveWave,
      bulkArchive,
      updateAgreementStatus,
      getPartnersByStage,
      getPartnersByCategory,
      getPartnersByWave,
      getOverdueFollowups,
      getActivePartners,
      updateSettings,
      connectToServer,
      disconnectFromServer,
      syncNow,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
