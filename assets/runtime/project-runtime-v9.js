(function (global) {
  'use strict';

  const STORAGE_KEY = 'lucasaguiar.savedProjects.v1';

  function readProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeProjects(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (err) {
      console.warn('LucasAguiar LocalStorage: falha ao gravar projetos.', err);
      return false;
    }
  }

  function create() {
    const api = async (payload) => {
      const records = readProjects();

      if (!payload) {
        return records.sort((a, b) =>
          String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
        );
      }

      const action = String(payload.action || '');
      if (action === 'save') {
        const id =
          String(payload.id || '').trim() ||
          `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const name = String(
          payload.name || payload.project?.name || 'Projeto sem título'
        ).trim();
        const now = new Date().toISOString();
        const projectCopy = JSON.parse(JSON.stringify(payload.project || {}));
        projectCopy.name = name;

        const existingIndex = records.findIndex((item) => String(item.id) === id);
        let record;
        if (existingIndex >= 0) {
          const prev = records[existingIndex];
          const versions = Array.isArray(prev.versions) ? [...prev.versions] : [];
          if (prev.project) {
            versions.unshift({
              at: prev.updatedAt || now,
              project: prev.project,
            });
          }
          record = {
            ...prev,
            id,
            name,
            updatedAt: now,
            project: projectCopy,
            versions: versions.slice(0, 15),
          };
          records[existingIndex] = record;
        } else {
          record = {
            id,
            name,
            createdAt: now,
            updatedAt: now,
            project: projectCopy,
            versions: [],
          };
          records.unshift(record);
        }

        writeProjects(records);
        try {
          localStorage.setItem('lucasaguiar.lastProject.v1', JSON.stringify(record));
        } catch {}

        return {
          ok: true,
          verified: true,
          id,
          record,
        };
      }

      if (action === 'delete') {
        const id = String(payload.id || '');
        const filtered = records.filter((item) => String(item.id) !== id);
        writeProjects(filtered);
        return {
          ok: true,
          verified: true,
          id,
        };
      }

      return { ok: true, verified: true, items: records };
    };

    const safeFileName = (value) =>
      String(value || 'Projeto sem título')
        .replace(/[^a-z0-9_-]+/gi, '-')
        .replace(/^-|-$/g, '') || 'projeto-lucasaguiar';

    const download = (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${safeFileName(data?.name)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      return link.download;
    };

    return { api, download, safeFileName };
  }

  global.TechRibProjectRuntime = { create };
})(window);
