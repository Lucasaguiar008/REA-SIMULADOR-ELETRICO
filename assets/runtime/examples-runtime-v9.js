(function (global) {
  'use strict';

  const USER_EXAMPLES_KEY = 'lucasaguiar.userExamples.v1';
  const STANDARD_OVERRIDES_KEY = 'lucasaguiar.standardExamples.v1';
  const PREMIUM_OVERRIDES_KEY = 'lucasaguiar.premiumExamples.v1';
  const DELETED_OFFICIAL_KEY = 'lucasaguiar.deletedOfficialExamples.v1';

  function readLocalArray(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeLocalArray(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr));
      return true;
    } catch (err) {
      console.warn('LucasAguiar LocalStorage: falha ao gravar exemplos em', key, err);
      return false;
    }
  }

  function createLocalExamplesHandler(storageKey, staticApiUrl) {
    return async (payload) => {
      const localItems = readLocalArray(storageKey);

      if (!payload) {
        if (!staticApiUrl) {
          return localItems;
        }
        let baseItems = [];
        try {
          const res = await fetch(staticApiUrl, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) baseItems = json;
            else if (Array.isArray(json?.records)) baseItems = json.records;
            else if (Array.isArray(json?.items)) baseItems = json.items;
          }
        } catch {}
        const merged = new Map(baseItems.map((item) => [String(item.id), item]));
        localItems.forEach((item) => {
          if (item && item.id) merged.set(String(item.id), item);
        });
        return [...merged.values()];
      }

      const action = String(payload.action || '');
      if (action === 'save' || action === 'replace-project') {
        const incoming = payload.record || payload;
        const id =
          String(incoming.id || '').trim() ||
          `example-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date().toISOString();
        const existingIdx = localItems.findIndex((x) => String(x.id) === id);
        const prev = existingIdx >= 0 ? localItems[existingIdx] : {};
        const record = {
          ...prev,
          ...incoming,
          id,
          name: String(
            incoming.name || incoming.project?.name || prev.name || 'Meu exemplo'
          ).trim(),
          updatedAt: now,
          project: JSON.parse(JSON.stringify(incoming.project || prev.project || {})),
        };
        delete record.action;

        if (existingIdx >= 0) {
          localItems[existingIdx] = record;
        } else {
          localItems.unshift(record);
        }
        writeLocalArray(storageKey, localItems);
        return {
          ok: true,
          verified: true,
          id,
          record,
        };
      }

      if (action === 'delete') {
        const id = String(payload.id || '');
        const next = localItems.filter((x) => String(x.id) !== id);
        writeLocalArray(storageKey, next);
        return {
          ok: true,
          verified: true,
          id,
        };
      }

      return { ok: true, verified: true, items: localItems };
    };
  }

  function create(options = {}) {
    const storageKey = options.storageKey || USER_EXAMPLES_KEY;
    const api = createLocalExamplesHandler(USER_EXAMPLES_KEY, null);
    const premiumApi = createLocalExamplesHandler(
      PREMIUM_OVERRIDES_KEY,
      options.premiumApiUrl || '/?api=premium-examples'
    );
    const standardApi = createLocalExamplesHandler(
      STANDARD_OVERRIDES_KEY,
      options.standardApiUrl || '/?api=standard-examples'
    );
    const deletedOfficialApi = async (payload) => {
      const current = new Set(readLocalArray(DELETED_OFFICIAL_KEY));
      if (!payload) return [...current];
      if (payload.action === 'delete' || payload.action === 'add') {
        if (payload.id) current.add(String(payload.id));
      } else if (payload.action === 'restore' || payload.action === 'remove') {
        if (payload.id) current.delete(String(payload.id));
      }
      const out = [...current];
      writeLocalArray(DELETED_OFFICIAL_KEY, out);
      return { ok: true, verified: true, deletedIds: out };
    };

    const local = () => readLocalArray(USER_EXAMPLES_KEY);
    const merge = (serverRecords) => {
      const merged = new Map(local().map((item) => [item.id, item]));
      (serverRecords || []).forEach((item) => {
        if (item && item.id) merged.set(item.id, item);
      });
      return [...merged.values()];
    };
    const removeLocal = (id) => {
      const next = local().filter((item) => String(item.id) !== String(id));
      writeLocalArray(USER_EXAMPLES_KEY, next);
    };
    const clearLocal = () => {};

    return {
      api,
      premiumApi,
      standardApi,
      deletedOfficialApi,
      local,
      merge,
      removeLocal,
      clearLocal,
      storageKey,
    };
  }

  global.TechRibExamplesRuntime = { create };
})(window);
