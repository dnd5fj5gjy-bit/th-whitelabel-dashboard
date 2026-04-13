// localStorage abstraction with 'th:' prefix

const PREFIX = 'th:';

const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('storage.set failed:', e);
    }
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },

  has(key) {
    return localStorage.getItem(PREFIX + key) !== null;
  },

  clear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  },
};

// Auto-configure server connection on first load
(function autoConfigServer() {
  if (!storage.has('serverUrl')) {
    storage.set('serverUrl', 'https://specialists-featured-private-others.trycloudflare.com');
    storage.set('serverApiKey', 'th-api-2026');
  }
})();

export default storage;
