/* ==========================================================================
   LucasAguiar Simulator — GitHub Pages & Static Hosting Compatibility Shim
   Permite que o simulador rode 100% estático no GitHub Pages (inclusive em
   subpastas https://usuario.github.io/repositorio/) sem precisar de backend.
   ========================================================================== */
(function () {
  'use strict';

  // Descobre o caminho base (ex.: "/" localmente ou "/nome-do-repo/" no GitHub Pages)
  function computeBasePath() {
    const path = window.location.pathname || '/';
    const cleaned = path
      .replace(/\/(index|app|404)\.html$/i, '/')
      .replace(/\/app\/?$/i, '/');
    return cleaned.endsWith('/') ? cleaned : cleaned + '/';
  }

  const BASE_PATH = computeBasePath();
  window.__LUCASAGUIAR_BASE_PATH__ = BASE_PATH;

  function resolveUrl(inputUrl) {
    if (typeof inputUrl !== 'string') return inputUrl;
    const trimmed = inputUrl.trim();

    // Intercepta chamadas ?api=<endpoint> e redireciona para ./api/<endpoint>.json
    if (/^(\/?\?api=|https?:\/\/[^/]+\/\?api=)/i.test(trimmed)) {
      try {
        const u = new URL(trimmed, window.location.origin);
        const apiName = u.searchParams.get('api');
        if (apiName) {
          return `${BASE_PATH}api/${encodeURIComponent(apiName)}.json`;
        }
      } catch {}
    }

    // Reescreve caminhos absolutos "/assets/..." para "<BASE_PATH>assets/..."
    if (trimmed.startsWith('/assets/')) {
      return BASE_PATH + trimmed.slice(1);
    }

    // Reescreve navegação "/app?example=..." para funcionar em subpasta do GitHub Pages
    if (trimmed.startsWith('/app?') || trimmed === '/app') {
      const query = trimmed.includes('?') ? trimmed.slice(trimmed.indexOf('?')) : '';
      return BASE_PATH + query;
    }

    return inputUrl;
  }

  // 1. Intercepta window.fetch para funcionar 100% sem servidor no GitHub Pages
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const method = String(
      init?.method || (typeof input === 'object' && input?.method) || 'GET'
    ).toUpperCase();
    const rawUrl = typeof input === 'string' ? input : input?.url || '';

    const isApiCall = /[?&]api=([^&]+)/i.test(rawUrl);
    if (isApiCall && method !== 'GET') {
      return new Response(
        JSON.stringify({
          ok: true,
          status: 'ok',
          authorized: true,
          verified: true,
          plan: 'pro',
          items: [],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    const resolved = resolveUrl(rawUrl);
    try {
      const response = await nativeFetch(resolved, init);
      if (!response.ok && isApiCall) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
      return response;
    } catch (err) {
      if (isApiCall) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
      throw err;
    }
  };

  // 2. Intercepta new Audio('/assets/sounds/...')
  const NativeAudio = window.Audio;
  if (typeof NativeAudio === 'function') {
    window.Audio = function (src) {
      return new NativeAudio(src ? resolveUrl(src) : src);
    };
    window.Audio.prototype = NativeAudio.prototype;
  }

  // 3. Ajusta TECHRIB_COMPONENT_VISUAL_URLS e imagens dinâmicas quando em subpasta no GitHub Pages
  function patchGlobalsAndDom() {
    if (
      BASE_PATH !== '/' &&
      window.TECHRIB_COMPONENT_VISUAL_URLS &&
      typeof window.TECHRIB_COMPONENT_VISUAL_URLS === 'object'
    ) {
      for (const [k, v] of Object.entries(window.TECHRIB_COMPONENT_VISUAL_URLS)) {
        if (typeof v === 'string' && v.startsWith('/assets/')) {
          window.TECHRIB_COMPONENT_VISUAL_URLS[k] = resolveUrl(v);
        }
      }
    }
    if (BASE_PATH !== '/') {
      document.querySelectorAll('img[src^="/assets/"], a[href="/app"]').forEach((el) => {
        if (el.hasAttribute('src')) {
          el.setAttribute('src', resolveUrl(el.getAttribute('src')));
        }
        if (el.getAttribute('href') === '/app') {
          el.setAttribute('href', BASE_PATH);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchGlobalsAndDom);
  } else {
    patchGlobalsAndDom();
  }
})();

