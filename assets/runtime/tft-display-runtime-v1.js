(() => {
  'use strict';

  const TYPES = ['board-esp32-2432s028r', 'board-viewe-uedx24320028e-wb-a'];
  const SELECTOR = TYPES.flatMap(type => [`.placed-component[data-type="${type}"]`, `.placed-component[data-registry-id="${type}"]`]).join(',');
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const LOGICAL_W = 320;
  const LOGICAL_H = 240;
  const SCREEN = { x: 13.7, y: 2.7, width: 57.6, height: 43.2 };
  const FALLBACK_SCENE = {
    background: '#06131f',
    commands: [
      { type: 'text', x: 16, y: 18, text: 'TechRib', size: 3, color: '#38bdf8' },
      { type: 'text', x: 16, y: 58, text: 'DISPLAY PRONTO', size: 2, color: '#ffffff' },
      { type: 'text', x: 16, y: 92, text: 'ESP32-2432S028R', size: 1, color: '#94a3b8' },
      { type: 'fillRect', x: 16, y: 126, width: 288, height: 58, color: '#0f766e' },
      { type: 'text', x: 32, y: 145, text: 'SISTEMA ONLINE', size: 2, color: '#ffffff' }
    ]
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const color = (value, fallback = '#ffffff') => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, finite(value, min)));
  const metrics = component => {
    const layer = component?.querySelector?.('[data-techrib-tft-layer="true"]');
    return {
      x: finite(layer?.dataset?.screenX, SCREEN.x),
      y: finite(layer?.dataset?.screenY, SCREEN.y),
      width: finite(layer?.dataset?.screenWidth, SCREEN.width),
      height: finite(layer?.dataset?.screenHeight, SCREEN.height),
      logicalW: finite(layer?.dataset?.screenLogicalWidth, LOGICAL_W),
      logicalH: finite(layer?.dataset?.screenLogicalHeight, LOGICAL_H)
    };
  };
  const sx = (cfg, value) => cfg.x + clamp(value, 0, cfg.logicalW) * cfg.width / cfg.logicalW;
  const sy = (cfg, value) => cfg.y + clamp(value, 0, cfg.logicalH) * cfg.height / cfg.logicalH;
  const sw = (cfg, value) => Math.max(0, finite(value)) * cfg.width / cfg.logicalW;
  const sh = (cfg, value) => Math.max(0, finite(value)) * cfg.height / cfg.logicalH;
  const svgNode = (tag, attrs = {}) => {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };
  const important = (node, properties) => {
    Object.entries(properties).forEach(([name, value]) => node.style.setProperty(name, String(value), 'important'));
    return node;
  };

  function componentType(component) {
    return String(component?.dataset?.registryId || component?.dataset?.type || TYPES[0]);
  }

  function defaultScene(component) {
    return clone(window.TECHRIB_COMPONENT_REGISTRY?.[componentType(component)]?.display?.defaultScene || FALLBACK_SCENE);
  }

  function normalizeScene(input) {
    const scene = input && typeof input === 'object' ? input : {};
    return {
      background: color(scene.background, '#06131f'),
      commands: Array.isArray(scene.commands) ? scene.commands.slice(0, 80).filter(command => command && typeof command === 'object') : [],
      touchAreas: Array.isArray(scene.touchAreas) ? scene.touchAreas.slice(0, 16).map((area, index) => ({
        x: clamp(area?.x, 0, LOGICAL_W), y: clamp(area?.y, 0, LOGICAL_H),
        width: clamp(area?.width, 1, LOGICAL_W), height: clamp(area?.height, 1, LOGICAL_H),
        ruleIndex: Math.max(0, Math.trunc(finite(area?.ruleIndex, index))),
        memory: String(area?.memory || `H${index + 1}`).slice(0, 24),
        label: String(area?.label || area?.memory || `H${index + 1}`).slice(0, 24)
      })) : []
    };
  }

  function logicMemory(component) {
    try { return JSON.parse(component?.dataset?.i2cLogicRuntime || '{}')?.memory || {}; } catch { return {}; }
  }

  function drawTouchAreas(layer, component, scene, cfg) {
    const memory = logicMemory(component);
    scene.touchAreas.forEach(area => {
      const on = Boolean(memory[area.memory]);
      const group = svgNode('g', { 'data-techrib-tft-touch-area': String(area.ruleIndex) });
      const rect = svgNode('rect', {
        x: sx(cfg, area.x), y: sy(cfg, area.y), width: sw(cfg, area.width), height: sh(cfg, area.height),
        rx: sw(cfg, 8), fill: on ? '#263116' : '#102536', stroke: on ? '#facc15' : '#36566b',
        'stroke-width': Math.max(0.22, sw(cfg, 2))
      });
      important(rect, { fill: on ? '#263116' : '#102536', stroke: on ? '#facc15' : '#36566b', 'stroke-width': Math.max(0.22, sw(cfg, 2)) });
      const bulbX = area.x + 25, bulbY = area.y + 23;
      const bulb = svgNode('circle', { cx: sx(cfg, bulbX), cy: sy(cfg, bulbY), r: sw(cfg, 10), fill: on ? '#fde047' : '#475569', stroke: on ? '#fff7ae' : '#64748b', 'stroke-width': sw(cfg, 2) });
      important(bulb, { fill: on ? '#fde047' : '#475569', stroke: on ? '#fff7ae' : '#64748b', 'stroke-width': sw(cfg, 2), filter: on ? 'drop-shadow(0 0 1.4px #facc15)' : 'none' });
      const base = svgNode('rect', { x: sx(cfg, bulbX - 6), y: sy(cfg, bulbY + 11), width: sw(cfg, 12), height: sh(cfg, 7), rx: sw(cfg, 2), fill: on ? '#f59e0b' : '#334155' });
      important(base, { fill: on ? '#f59e0b' : '#334155', stroke: 'none' });
      if (on) [[0,-16],[15,-9],[15,9],[-15,-9],[-15,9]].forEach(([dx,dy]) => {
        const len = dx === 0 ? 5 : 4, mag = Math.hypot(dx,dy) || 1;
        const ray = svgNode('line', { x1:sx(cfg, bulbX+dx), y1:sy(cfg, bulbY+dy), x2:sx(cfg, bulbX+dx+dx/mag*len), y2:sy(cfg, bulbY+dy+dy/mag*len), stroke:'#fde047', 'stroke-width':sw(cfg, 2), 'stroke-linecap':'round' });
        important(ray, { stroke:'#fde047', 'stroke-width':sw(cfg, 2) }); group.appendChild(ray);
      });
      const label = svgNode('text', {
        x: sx(cfg, area.x + 62), y: sy(cfg, area.y + 10), fill: '#e2e8f0',
        'font-family': 'DejaVu Sans Mono, Consolas, monospace',
        'font-size': Math.max(0.95, 7 * cfg.height / cfg.logicalH), 'font-weight': 700,
        'dominant-baseline': 'hanging'
      });
      important(label, { fill:'#e2e8f0', stroke:'none', 'font-size':`${Math.max(0.95, 7 * cfg.height / cfg.logicalH)}px`, 'font-weight':'700', 'font-family':'DejaVu Sans Mono, Consolas, monospace', transform:'none' });
      label.textContent = area.label;
      const status = svgNode('text', { x:sx(cfg, area.x+62), y:sy(cfg, area.y+29), fill:on?'#fde047':'#7890a3', 'font-family':'DejaVu Sans Mono, Consolas, monospace', 'font-size':Math.max(1.05, 9*cfg.height/cfg.logicalH), 'font-weight':900, 'dominant-baseline':'hanging' });
      important(status, { fill:on?'#fde047':'#7890a3', stroke:'none', 'font-size':`${Math.max(1.05, 9*cfg.height/cfg.logicalH)}px`, 'font-weight':'900', 'font-family':'DejaVu Sans Mono, Consolas, monospace', transform:'none' });
      status.textContent = on ? 'LIGADA' : 'DESLIGADA';
      group.prepend(rect); group.append(bulb, base, label, status); layer.appendChild(group);
    });
  }

  function getScene(component) {
    try {
      if (component?.dataset?.tftScene) return normalizeScene(JSON.parse(component.dataset.tftScene));
    } catch (error) {
      console.warn('TechRib TFT: cena salva inválida; usando padrão.', error);
    }
    return normalizeScene(defaultScene(component));
  }

  function drawCommand(layer, command, cfg) {
    const type = String(command.type || '');
    const fill = color(command.color);
    let node = null;
    if (type === 'text') {
      node = svgNode('text', {
        x: sx(cfg, command.x), y: sy(cfg, command.y), fill,
        'font-family': 'DejaVu Sans Mono, Consolas, monospace',
        'font-size': Math.max(0.95, finite(command.size, 1) * 7 * cfg.height / cfg.logicalH),
        'font-weight': command.bold === false ? 500 : 700,
        'dominant-baseline': 'hanging'
      });
      important(node, {
        fill,
        stroke: 'none',
        'stroke-width': '0',
        'font-family': 'DejaVu Sans Mono, Consolas, monospace',
        'font-size': `${Math.max(0.95, finite(command.size, 1) * 7 * cfg.height / cfg.logicalH)}px`,
        'font-weight': command.bold === false ? 500 : 700,
        'font-style': 'normal',
        'letter-spacing': '0',
        'text-anchor': 'start',
        'dominant-baseline': 'hanging',
        'paint-order': 'normal',
        transform: 'none'
      });
      node.textContent = String(command.text ?? '').slice(0, 80);
    } else if (type === 'fillRect' || type === 'drawRect') {
      node = svgNode('rect', {
        x: sx(cfg, command.x), y: sy(cfg, command.y), width: sw(cfg, command.width), height: sh(cfg, command.height),
        rx: Math.max(0, sw(cfg, command.radius || 0)), fill: type === 'fillRect' ? fill : 'none',
        stroke: type === 'drawRect' ? fill : 'none', 'stroke-width': Math.max(0.18, sw(cfg, command.strokeWidth || 2))
      });
    } else if (type === 'drawLine') {
      node = svgNode('line', {
        x1: sx(cfg, command.x), y1: sy(cfg, command.y), x2: sx(cfg, command.x2), y2: sy(cfg, command.y2),
        stroke: fill, 'stroke-width': Math.max(0.18, sw(cfg, command.strokeWidth || 2)), 'stroke-linecap': 'round'
      });
    } else if (type === 'drawCircle' || type === 'fillCircle') {
      node = svgNode('circle', {
        cx: sx(cfg, command.x), cy: sy(cfg, command.y), r: Math.max(0, sw(cfg, command.radius)),
        fill: type === 'fillCircle' ? fill : 'none', stroke: type === 'drawCircle' ? fill : 'none',
        'stroke-width': Math.max(0.18, sw(cfg, command.strokeWidth || 2))
      });
    }
    if (node && type !== 'text') important(node, {
      fill: node.getAttribute('fill') || 'none',
      stroke: node.getAttribute('stroke') || 'none',
      'stroke-width': node.getAttribute('stroke-width') || '0'
    });
    if (node) layer.appendChild(node);
  }

  function render(component) {
    if (!component?.isConnected) return false;
    const layer = component.querySelector('[data-techrib-tft-content="true"]');
    const background = component.querySelector('[data-techrib-tft-background="true"]');
    if (!layer || !background) return false;
    const owner = layer.parentNode;
    const cfg = metrics(component);
    let clip = owner.querySelector(':scope > defs[data-techrib-tft-defs]');
    let clipId = clip?.querySelector('clipPath')?.id || '';
    if (!clip) {
      const safeId = String(component.dataset.componentId || Math.random().toString(36).slice(2)).replace(/[^a-z0-9_-]/gi, '-');
      clipId = `techrib-tft-clip-${safeId}`;
      clip = svgNode('defs', { 'data-techrib-tft-defs': 'true' });
      const clipPath = svgNode('clipPath', { id: clipId });
      clipPath.appendChild(svgNode('rect', { x: cfg.x, y: cfg.y, width: cfg.width, height: cfg.height, rx: 0.55 }));
      clip.appendChild(clipPath);
      owner.insertBefore(clip, owner.firstChild);
    }
    layer.setAttribute('clip-path', `url(#${clipId})`);
    layer.style.setProperty('clip-path', `url(#${clipId})`, 'important');
    const scene = getScene(component);
    background.setAttribute('fill', scene.background);
    important(background, { fill: scene.background, stroke: 'none' });
    layer.replaceChildren();
    scene.commands.forEach(command => drawCommand(layer, command, cfg));
    drawTouchAreas(layer, component, scene, cfg);
    component.dataset.tftRuntimeReady = 'true';
    return true;
  }

  function setScene(component, scene) {
    const normalized = normalizeScene(scene);
    component.dataset.tftScene = JSON.stringify(normalized);
    render(component);
    component.dispatchEvent(new Event('input', { bubbles: true }));
    component.dispatchEvent(new CustomEvent('techrib:tft-scene-changed', { bubbles: true, detail: { scene: clone(normalized) } }));
    return normalized;
  }

  function simpleValues(scene) {
    const texts = scene.commands.filter(command => command.type === 'text');
    const panel = scene.commands.find(command => command.type === 'fillRect');
    return {
      title: String(texts[0]?.text || 'TechRib'),
      line1: String(texts[1]?.text || 'DISPLAY PRONTO'),
      line2: String(texts[2]?.text || 'ESP32-2432S028R'),
      status: String(texts[3]?.text || 'SISTEMA ONLINE'),
      background: color(scene.background, '#06131f'),
      accent: color(panel?.color || texts[0]?.color, '#0f766e')
    };
  }

  function sceneFromValues(values) {
    return normalizeScene({
      background: values.background,
      commands: [
        { type: 'text', x: 16, y: 18, text: values.title, size: 3, color: '#38bdf8' },
        { type: 'text', x: 16, y: 58, text: values.line1, size: 2, color: '#ffffff' },
        { type: 'text', x: 16, y: 92, text: values.line2, size: 1, color: '#94a3b8' },
        { type: 'fillRect', x: 16, y: 126, width: 288, height: 58, color: values.accent },
        { type: 'text', x: 32, y: 145, text: values.status, size: 2, color: '#ffffff' }
      ]
    });
  }

  function ensureEditor() {
    let modal = document.getElementById('techrib-tft-editor');
    if (modal) return modal;
    const style = document.createElement('style');
    style.textContent = `
      #techrib-tft-editor{position:fixed;inset:0;z-index:100000;background:#020617bb;display:none;place-items:center;padding:20px}
      #techrib-tft-editor.is-open{display:grid}
      #techrib-tft-editor .tft-card{width:min(520px,94vw);background:#0b1f2d;color:#e5f6ff;border:1px solid #38bdf8;border-radius:16px;box-shadow:0 24px 70px #000a;padding:20px;font:600 13px Inter,Arial,sans-serif}
      #techrib-tft-editor h2{margin:0 0 5px;font-size:20px} #techrib-tft-editor p{margin:0 0 16px;color:#9fc2d4;font-weight:500}
      #techrib-tft-editor .tft-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px} #techrib-tft-editor label{display:grid;gap:5px;color:#bfe9fb}
      #techrib-tft-editor label.wide{grid-column:1/-1} #techrib-tft-editor input{width:100%;box-sizing:border-box;background:#06131f;color:#fff;border:1px solid #315369;border-radius:8px;padding:9px}
      #techrib-tft-editor .tft-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px} #techrib-tft-editor button{border:1px solid #3b82a0;border-radius:9px;background:#11354a;color:#fff;padding:9px 13px;font-weight:800;cursor:pointer}
      #techrib-tft-editor button.primary{background:#0891b2;border-color:#22d3ee} #techrib-tft-editor button.danger{margin-right:auto;background:#3a2028;border-color:#8b3b52}
    `;
    document.head.appendChild(style);
    modal = document.createElement('div');
    modal.id = 'techrib-tft-editor';
    modal.innerHTML = `<form class="tft-card">
      <h2>Tela ILI9341 • ESP32-2432S028R</h2><p>O conteúdo é salvo nesta instância e reproduzido no código TFT_eSPI.</p>
      <div class="tft-grid">
        <label class="wide">Título<input name="title" maxlength="24"></label>
        <label class="wide">Linha principal<input name="line1" maxlength="28"></label>
        <label class="wide">Linha secundária<input name="line2" maxlength="32"></label>
        <label class="wide">Status<input name="status" maxlength="24"></label>
        <label>Fundo<input name="background" type="color"></label>
        <label>Destaque<input name="accent" type="color"></label>
      </div>
      <div class="tft-actions"><button type="button" class="danger" data-reset>Restaurar padrão</button><button type="button" data-close>Cancelar</button><button class="primary" type="submit">Aplicar na tela</button></div>
    </form>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => { if (event.target === modal) modal.classList.remove('is-open'); });
    modal.querySelector('[data-close]').addEventListener('click', () => modal.classList.remove('is-open'));
    modal.querySelector('[data-reset]').addEventListener('click', () => {
      if (modal.techribComponent) setScene(modal.techribComponent, defaultScene(modal.techribComponent));
      modal.classList.remove('is-open');
    });
    modal.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      if (modal.techribComponent) setScene(modal.techribComponent, sceneFromValues(data));
      modal.classList.remove('is-open');
    });
    return modal;
  }

  function openEditor(component) {
    const modal = ensureEditor();
    const values = simpleValues(getScene(component));
    Object.entries(values).forEach(([key, value]) => { const input = modal.querySelector(`[name="${key}"]`); if (input) input.value = value; });
    modal.techribComponent = component;
    modal.classList.add('is-open');
  }

  function attach(component) {
    if (!render(component) || component.__techribTftRuntimeBound === true) return;
    component.__techribTftRuntimeBound = true;
    delete component.dataset.tftRuntimeBound;
    const hitbox = component.querySelector('[data-techrib-tft-hitbox="true"]');
    hitbox?.addEventListener('click', event => {
      const scene = getScene(component); if (!scene.touchAreas.length) return;
      const ctm = hitbox.getScreenCTM?.(); if (!ctm) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
      const cfg = metrics(component);
      const x = (point.x - cfg.x) * cfg.logicalW / cfg.width;
      const y = (point.y - cfg.y) * cfg.logicalH / cfg.height;
      const area = scene.touchAreas.find(item => x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height);
      if (!area) return;
      event.preventDefault(); event.stopPropagation();
      const control = component.querySelector(`[data-i2c-rule-index="${area.ruleIndex}"]`);
      control?.click();
      setTimeout(() => render(component), 240);
      component.dispatchEvent(new CustomEvent('techrib:tft-touch', { bubbles: true, detail: { ...area } }));
    });
    hitbox?.addEventListener('dblclick', event => {
      event.preventDefault(); event.stopPropagation(); openEditor(component);
    });
    hitbox?.addEventListener('pointerdown', event => { if (event.detail > 1) event.stopPropagation(); });
    component.__techribTftStateObserver?.disconnect?.();
    component.__techribTftStateObserver = new MutationObserver(() => render(component));
    component.__techribTftStateObserver.observe(component, { attributes: true, attributeFilter: ['data-i2c-logic-runtime','data-logic-powered'] });
  }

  function scan(root = document) {
    if (root.matches?.(SELECTOR)) attach(root);
    root.querySelectorAll?.(SELECTOR).forEach(attach);
  }

  function init() {
    scan();
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); }))).observe(document.body, { childList: true, subtree: true });
  }

  window.TechRibTftDisplayRuntime = { version: '1.2.0', types: TYPES.slice(), render, getScene, setScene, openEditor };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
