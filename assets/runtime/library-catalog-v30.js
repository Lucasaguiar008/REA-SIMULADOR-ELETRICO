/* LucasAguiar V30 — catálogo/preview/pesquisa da biblioteca (com categoria EXTRAS totalmente ativa). */
(function (root) {
  'use strict';
  const VERSION = 30;
  const DOMAIN_SPEC = Object.freeze([
    [
      'electrical',
      'ELÉTRICA',
      '⚡',
      [
        'Fontes',
        'Proteção',
        'Distribuição / Barramentos',
        'Contatores',
        'Relés',
        'Comando',
        'Infraestrutura de montagem',
        'Quadros de comando',
        'Componentes de porta',
        'Residencial',
        'Motores e cargas',
        'Inversores',
        'Soft-starters',
        'Bornes e conectores',
      ],
    ],
    [
      'automation',
      'AUTOMAÇÃO',
      '⚙',
      [
        'Microcontroladores',
        'Módulos relé',
        'Sensores',
        'Expansão I/O',
        'Drivers',
        'Displays',
        'Comunicação',
      ],
    ],
    [
      'electronics',
      'ELETRÔNICA',
      '⌁',
      [
        'Resistores',
        'Capacitores',
        'Diodos',
        'Transistores',
        'Circuitos integrados',
        'LEDs',
        'Conectores',
      ],
    ],
    [
      'premium',
      'EXTRAS',
      '◆',
      [
        'Elevadores',
        'Sistemas de bombeamento',
        'Portões automáticos',
        'Esteiras transportadoras',
        'Pontes rolantes',
        'Compressores',
        'HVAC',
        'Máquinas industriais',
        'Sistemas especiais',
      ],
    ],
  ]);

  function create(options = {}) {
    const doc = options.root || root.document;
    const registryDefinition =
      typeof options.registryDefinition === 'function'
        ? options.registryDefinition
        : () => null;
    const libraryState = options.libraryState || {};
    const scroll = doc.querySelector('.library-scroll');
    const sourceStash = doc.createElement('div');
    sourceStash.className = 'library-source-stash';
    sourceStash.hidden = true;
    doc.body.appendChild(sourceStash);
    const familyGrids = new Map();
    let bound = false;

    const normalizeText = (value) =>
      String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const activatePreview = (image) => {
      if (!image || image.getAttribute('src')) return;
      const url = image.dataset.techribPreviewUrl;
      if (url) image.setAttribute('src', url);
    };
    const previewObserver =
      'IntersectionObserver' in root && scroll
        ? new root.IntersectionObserver(
            (entries) =>
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  activatePreview(entry.target);
                  previewObserver.unobserve(entry.target);
                }
              }),
            { root: scroll, rootMargin: '180px 0px' }
          )
        : null;
    const observePreview = (image) => {
      if (!image || image.getAttribute('src')) return;
      if (previewObserver) previewObserver.observe(image);
      else activatePreview(image);
    };
    const prepare = (item) => {
      if (!item || item.dataset.wireColor) return;
      const existing = item.querySelector(':scope > .library-svg-preview');
      if (existing) {
        observePreview(existing);
        return;
      }
      const source = item.querySelector(':scope > svg');
      if (!source) return;
      const preview = source.cloneNode(true);
      preview
        .querySelectorAll(
          '.wire-anchor-hitbox,[data-techrib-wokwi-terminals],[data-techrib-pin-labels]'
        )
        .forEach((node) => node.remove());
      if (!preview.getAttribute('viewBox')) {
        const w = parseFloat(preview.getAttribute('width') || ''),
          h = parseFloat(preview.getAttribute('height') || '');
        if (w > 0 && h > 0) preview.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
      preview.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      preview.removeAttribute('width');
      preview.removeAttribute('height');
      preview.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const xml = new XMLSerializer().serializeToString(preview),
        image = doc.createElement('img');
      image.className = 'library-svg-preview';
      image.alt = item.dataset.label || item.dataset.component || 'Componente';
      image.draggable = false;
      image.loading = 'lazy';
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      source.classList.add('library-source-svg');
      source.setAttribute('aria-hidden', 'true');
      item.insertBefore(image, source);
    };
    const classify = (item) => {
      const type = String(item.dataset.component || ''),
        label = String(item.dataset.label || type),
        definition = registryDefinition(type) || {},
        group = String(
          definition.libraryGroup ||
            definition.group ||
            item.dataset.libraryGroup ||
            ''
        ),
        behavior = String(definition.behavior?.type || ''),
        category = String(
          definition.libraryCategory || definition.category || ''
        ),
        text = normalizeText(
          `${type} ${label} ${group} ${behavior} ${category} ${(
            definition.keywords || []
          ).join(' ')}`
        );
      const result = (domain, family, keywords = '') => ({
        domain,
        family,
        keywords: `${text} ${normalizeText(keywords)}`,
      });

      // Classificação explícita para a aba EXTRAS (antiga PREMIUM) com todas as subcategorias ativas
      if (type === 'elevador-4-andares')
        return result('premium', 'Elevadores', 'extras elevador 4 andares');
      if (type === 'sistema-bombeamento-reservatorios')
        return result(
          'premium',
          'Sistemas de bombeamento',
          'extras sistema bombeamento reservatorios cisterna'
        );
      if (type === 'sistema-portoes-automaticos')
        return result(
          'premium',
          'Portões automáticos',
          'extras portao automatico fim de curso fotocelula'
        );
      if (
        type === 'sistema-esteiras-transportadoras' ||
        type === 'industrial-esteira-separadora'
      )
        return result(
          'premium',
          'Esteiras transportadoras',
          'extras esteira transportadora separadora industrial'
        );
      if (type === 'sistema-pontes-rolantes')
        return result(
          'premium',
          'Pontes rolantes',
          'extras ponte rolante talha movimentacao'
        );
      if (type === 'industrial-compressor-reservatorio')
        return result(
          'premium',
          'Compressores',
          'extras compressor industrial reservatorio pressostato'
        );
      if (
        type === 'processo-camara-fria' ||
        type === 'industrial-exaustor-centrifugo'
      )
        return result(
          'premium',
          'HVAC',
          'extras hvac camara fria refrigeracao exaustor ventilacao'
        );
      if (
        type === 'processo-envasadora' ||
        type === 'industrial-tanque-agitador' ||
        type === 'estacao-pesagem-industrial' ||
        type === 'modulo-pesagem-industrial'
      )
        return result(
          'premium',
          'Máquinas industriais',
          'extras maquinas industriais envasadora tanque agitador pesagem'
        );
      if (
        type === 'estacionamento-inteligente-esp32' ||
        type === 'braco-robotico-scara-esp32' ||
        type === 'mini-cnc-eixo-linear-esp32' ||
        type === 'controlador-irrigacao-2zonas' ||
        type === 'valvula-envase-industrial' ||
        type === 'valvula-solenoide-irrigacao' ||
        group === 'Robótica e Movimento'
      )
        return result(
          'premium',
          'Sistemas especiais',
          'extras sistemas especiais robotica scara mini cnc estacionamento irrigacao'
        );

      if (
        group === 'Infraestrutura de montagem' ||
        definition.classification === 'mechanical' ||
        /trilho din|din rail/.test(text)
      )
        return result(
          'electrical',
          'Infraestrutura de montagem',
          'trilho din 35 mm perfurado montagem painel quadro mecanico infraestrutura'
        );
      if (
        group === 'Distribuição / Barramentos' ||
        /pente de ligacao|pente de ligação|barramento pente|comb busbar/.test(
          text
        )
      )
        return result(
          'electrical',
          'Distribuição / Barramentos',
          'pente 1p 2p 3p barramento distribuição disjuntor condutor rígido din'
        );
      if (group === 'Quadros de comando')
        return result(
          'electrical',
          'Quadros de comando',
          'quadro painel gabinete porta laranja'
        );
      if (group === 'Componentes de porta')
        return result(
          'electrical',
          'Componentes de porta',
          'porta botoeira sinaleiro seletora plaqueta perigo protetor cabos'
        );
      if (definition.premium === true || category === 'premium') {
        const validFamilies = new Set(DOMAIN_SPEC[3][3]);
        const targetFamily = validFamilies.has(group)
          ? group
          : 'Sistemas especiais';
        return result(
          'premium',
          targetFamily,
          'extras macrocomponente sistema especial'
        );
      }
      if (/resistor/.test(text)) return result('electronics', 'Resistores');
      if (/capacitor/.test(text)) return result('electronics', 'Capacitores');
      if (/diod|retificador|zener/.test(text))
        return result('electronics', 'Diodos');
      if (/transistor|mosfet|driver array|uln/.test(text))
        return result('electronics', 'Transistores');
      if (
        /circuito integrado|integrated|optocoupler|optoacoplador|ci\b/.test(
          text
        )
      )
        return result('electronics', 'Circuitos integrados');
      if (/led eletr|rgb led|indicator led/.test(text))
        return result('electronics', 'LEDs');
      if (/conector/.test(text) && /logic|electronic|eletron/.test(text))
        return result('electronics', 'Conectores');
      if (
        /esp32|esp8266|arduino|raspberry pi pico|rp2040|stm32|microcontrol/.test(
          text
        )
      )
        return result('automation', 'Microcontroladores');
      if (
        /relay-module|modulo rele|módulo relé|modulos de rele|módulos de relé/.test(
          text
        )
      )
        return result('automation', 'Módulos relé');
      if (/expansao|expansão|i\/o|io expander|pcf8574|mcp230/.test(text))
        return result('automation', 'Expansão I/O');
      if (/display|lcd|oled|hmi/.test(text))
        return result('automation', 'Displays');
      if (
        /comunicacao|comunicação|rfid|bluetooth|wifi|can\b|rs485|uart|lora/.test(
          text
        )
      )
        return result('automation', 'Comunicação');
      if (/driver|ponte h|stepper/.test(text) && !/^inversor/.test(type))
        return result('automation', 'Drivers');
      if (/sensor|pressostato|boia|fim-curso|fim de curso/.test(text))
        return result('automation', 'Sensores');
      if (
        /^resid-/.test(type) ||
        /residencial|tomada|chuveiro|haste de aterramento|canaleta de quadro|quadro de distribuicao|quadro de distribuição/.test(
          text
        )
      )
        return result(
          'electrical',
          'Residencial',
          'instalação residencial quadro QDC tomada 4x2 chuveiro aterramento neutro terra canaleta'
        );
      if (
        type.startsWith('fonte-') ||
        type === 'transformador-comando' ||
        /alimentacao|alimentação|fonte\b|power supply/.test(text)
      )
        return result(
          'electrical',
          'Fontes',
          'AC DC 3,3V 5V 12V 24V 110V 127V 220V trifásica monofásica bifásica'
        );
      if (
        type.startsWith('contator') ||
        behavior === 'contactor' ||
        behavior === 'reversing-contactor'
      )
        return result('electrical', 'Contatores');
      if (
        /disjuntor|fusivel|fusível|\bdr\b|dps|rele termico|relé térmico|falta de fase|mpcb|protecao|proteção/.test(
          text
        )
      )
        return result('electrical', 'Proteção');
      if (
        /^contato-auxiliar/.test(type) ||
        type === 'contato-auxiliar-disjuntor'
      )
        return result('electrical', 'Contatores');
      if (
        /^rele-|^temporizador/.test(type) ||
        /rele auxiliar|relé auxiliar|temporizador/.test(text)
      )
        return result('electrical', 'Relés');
      if (
        /botoeira|botao-emergencia|botão de emergência|chave-seletora|chave-alavanca|chave-comutadora|chave-seccionadora|resid-interruptor|three-way|four-way/.test(
          text
        )
      )
        return result('electrical', 'Comando');
      if (
        /^motor-|^bomba-|^sinaleiro-|resid-lampada|lampada|lâmpada|solenoide|carga/.test(
          text
        )
      )
        return result('electrical', 'Motores e cargas');
      if (
        /inversor-frequencia|inversor de frequencia|inversor de frequência/.test(
          text
        )
      )
        return result('electrical', 'Inversores');
      if (/soft-starter|soft starter/.test(text))
        return result('electrical', 'Soft-starters');
      if (/^borne-|^barramento-|terminal block|borne\b/.test(text))
        return result('electrical', 'Bornes e conectores');
      if (String(definition.category || '') === 'logic')
        return result('automation', 'Sensores');
      return result('electrical', 'Comando');
    };
    const place = (item) => {
      const type = item.dataset.component || '',
        definition = registryDefinition(type) || {};
      if (
        libraryState[type]?.active === false ||
        definition.active === false ||
        definition.hidden === true
      ) {
        sourceStash.appendChild(item);
        return item;
      }
      const info = classify(item),
        grid =
          familyGrids.get(`${info.domain}|${info.family}`) ||
          familyGrids.get('electrical|Comando');
      item.dataset.libraryDomain = info.domain;
      item.dataset.libraryFamily = info.family;
      item.dataset.librarySearch = normalizeText(
        `${item.dataset.label || type} ${type} ${info.domain} ${info.family} ${
          info.keywords
        }`
      );
      prepare(item);
      grid?.appendChild(item);
      grid?.closest('.library-family')?.removeAttribute('hidden');
      return item;
    };
    const build = () => {
      if (!scroll) return 0;
      const allItems = [...scroll.querySelectorAll('.component-item')];
      allItems
        .filter((item) => item.dataset.wireColor)
        .forEach((item) => sourceStash.appendChild(item));
      const items = allItems.filter((item) => !item.dataset.wireColor);
      scroll.replaceChildren();
      familyGrids.clear();
      DOMAIN_SPEC.forEach(([domain, title, icon, families]) => {
        const section = doc.createElement('section');
        section.className = 'library-group library-domain';
        section.dataset.libraryDomain = domain;
        const rootTitle = doc.createElement('button');
        rootTitle.className = 'group-title library-domain-title';
        rootTitle.type = 'button';
        rootTitle.setAttribute('aria-expanded', 'false');
        rootTitle.innerHTML = `<span>${icon}</span><b>${title}</b><small>⌄</small>`;
        const familiesWrap = doc.createElement('div');
        familiesWrap.className = 'library-families';
        families.forEach((family) => {
          const familySection = doc.createElement('section');
          familySection.className = 'library-family';
          familySection.dataset.libraryFamily = family;
          const titleButton = doc.createElement('button');
          titleButton.type = 'button';
          titleButton.className = 'library-family-title';
          titleButton.setAttribute('aria-expanded', 'false');
          titleButton.innerHTML = `<b>${family}</b><small>⌄</small>`;
          const grid = doc.createElement('div');
          grid.className = 'component-grid';
          familySection.append(titleButton, grid);
          familiesWrap.appendChild(familySection);
          familyGrids.set(`${domain}|${family}`, grid);
        });
        section.append(rootTitle, familiesWrap);
        scroll.appendChild(section);
      });
      items.forEach(place);
      [...scroll.querySelectorAll('.library-family')].forEach(
        (section) =>
          (section.hidden = section.closest('[data-library-domain="premium"]')
            ? false
            : !section.querySelector('.component-item'))
      );
      doc.querySelectorAll('.component-item[data-component]').forEach(prepare);
      return items.length;
    };
    const setSectionOpen = (section, open) => {
      section.classList.toggle('open', open);
      const button = section.querySelector(
        ':scope > .group-title, :scope > .library-family-title'
      );
      button?.setAttribute('aria-expanded', open ? 'true' : 'false');
      const mark = button?.querySelector('small');
      if (mark) mark.textContent = open ? '⌃' : '⌄';
    };
    const bind = () => {
      if (bound) return;
      bound = true;
      scroll?.addEventListener('click', (event) => {
        const button = event.target.closest(
          '.library-domain-title,.library-family-title'
        );
        if (!button) return;
        const section = button.parentElement;
        if (!section) return;
        event.preventDefault();
        event.stopPropagation();
        const opening = !section.classList.contains('open');
        if (section.classList.contains('library-domain') && opening)
          section.parentElement
            ?.querySelectorAll(':scope > .library-domain.open')
            .forEach((other) => {
              if (other !== section) setSectionOpen(other, false);
            });
        if (section.classList.contains('library-family') && opening)
          section.parentElement
            ?.querySelectorAll(':scope > .library-family.open')
            .forEach((other) => {
              if (other !== section) setSectionOpen(other, false);
            });
        setSectionOpen(section, opening);
      });
      doc
        .querySelector('.component-search input')
        ?.addEventListener('input', (event) => {
          const term = normalizeText(event.target.value.trim());
          doc
            .querySelectorAll('.component-item[data-component]')
            .forEach((item) =>
              item.classList.toggle(
                'filtered',
                Boolean(term) &&
                  !(
                    item.dataset.librarySearch ||
                    normalizeText(item.dataset.label)
                  ).includes(term)
              )
            );
          doc.querySelectorAll('.library-family').forEach((family) => {
            const any = [
              ...family.querySelectorAll('.component-item[data-component]'),
            ].some((item) => !item.classList.contains('filtered'));
            family.classList.toggle('search-empty', Boolean(term) && !any);
            if (term && any) setSectionOpen(family, true);
            else if (!term) setSectionOpen(family, false);
          });
          doc.querySelectorAll('.library-domain').forEach((domain) => {
            const any = [
              ...domain.querySelectorAll('.component-item[data-component]'),
            ].some((item) => !item.classList.contains('filtered'));
            domain.classList.toggle('search-empty', Boolean(term) && !any);
            if (term && any) setSectionOpen(domain, true);
            else if (!term) setSectionOpen(domain, false);
          });
          doc
            .querySelectorAll('.example-card')
            .forEach((item) =>
              item.classList.toggle(
                'filtered',
                Boolean(term) && !item.dataset.search.includes(term)
              )
            );
        });
    };
    return Object.freeze({
      version: VERSION,
      normalizeText,
      prepare,
      classify,
      place,
      build,
      setSectionOpen,
      bind,
      stash: sourceStash,
      familyGrids,
    });
  }
  root.TechRibLibraryCatalogV30 = Object.freeze({
    VERSION,
    create,
    domainSpec: DOMAIN_SPEC,
  });
})(typeof window !== 'undefined' ? window : globalThis);
