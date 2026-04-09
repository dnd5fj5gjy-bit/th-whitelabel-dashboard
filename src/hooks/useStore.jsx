import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import storage from '../lib/storage.js';
import SEED_PARTNERS from '../lib/partners.js';

const StoreContext = createContext(null);

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

  const persist = useCallback((next) => {
    setPartners(next);
    storage.set('partners', next);
  }, []);

  // CRUD
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
    return newPartner;
  }, []);

  const updatePartner = useCallback((id, updates) => {
    setPartners((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      storage.set('partners', next);
      return next;
    });
  }, []);

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
  }, []);

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
      return next;
    });
    return newInteraction;
  }, []);

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
      return next;
    });
  }, []);

  const deleteInteraction = useCallback((partnerId, interactionId) => {
    setPartners((prev) => {
      const next = prev.map((p) =>
        p.id === partnerId
          ? { ...p, interactions: p.interactions.filter((i) => i.id !== interactionId) }
          : p
      );
      storage.set('partners', next);
      return next;
    });
  }, []);

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
      return next;
    });
  }, []);

  const bulkMoveWave = useCallback((ids, wave) => {
    setPartners((prev) => {
      const idSet = new Set(ids);
      const next = prev.map((p) => (idSet.has(p.id) ? { ...p, wave } : p));
      storage.set('partners', next);
      return next;
    });
  }, []);

  const bulkArchive = useCallback((ids) => {
    setPartners((prev) => {
      const idSet = new Set(ids);
      const next = prev.map((p) => (idSet.has(p.id) ? { ...p, archived: true } : p));
      storage.set('partners', next);
      return next;
    });
  }, []);

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
  }, []);

  const value = useMemo(
    () => ({
      partners,
      settings,
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
    }),
    [
      partners,
      settings,
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
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
