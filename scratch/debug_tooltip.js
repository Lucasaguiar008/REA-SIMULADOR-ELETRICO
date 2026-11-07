const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'C:\\Users\\lucas\\.gemini\\antigravity\\brain\\6b8907c1-bdac-4410-a96c-2e36ef9d27a9';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = ''; res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function run() {
  const userDataDir = path.join(OUT_DIR, 'scratch', 'chrome_profile_tooltip_' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9288',
    '--window-size=1680,1050',
    `--user-data-dir=${userDataDir}`,
    'http://127.0.0.1:3000/app?example=resid-simple-lamp'
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        targets = await getJson('http://127.0.0.1:9288/json');
        if (targets && targets.length > 0 && targets.find(t => t.type === 'page')) break;
      } catch (e) {}
    }
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const curId = id++;
        const listener = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === curId) {
            ws.removeEventListener('message', listener);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', listener);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');
    await sleep(2000);

    // Test with cadTools overflow visible and high z-index on cad-ribbon
    await send('Runtime.evaluate', {
      expression: `(() => {
        const ribbon = document.querySelector('.cad-ribbon');
        const cadTools = document.querySelector('.cad-tools');
        if (ribbon) {
          ribbon.style.overflow = 'visible';
          ribbon.style.zIndex = '1000';
        }
        if (cadTools) {
          cadTools.style.overflow = 'visible';
          cadTools.style.overflowX = 'visible';
          cadTools.style.overflowY = 'visible';
        }
      })()`,
      returnByValue: true
    });
    
    // Hover real mouse over the third button (Salvar)
    const btnBox = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.tool-group button[data-action="save"]');
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`,
      returnByValue: true
    });
    
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: btnBox.result.value.x,
      y: btnBox.result.value.y
    });
    await sleep(400);

    // Get all elements under the tooltip area
    const stackInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.tool-group button[data-action="save"]');
        const small = btn.querySelector('small');
        const sRect = small.getBoundingClientRect();
        const cx = sRect.left + sRect.width / 2;
        const cy = sRect.top + sRect.height / 2;
        
        const elements = document.elementsFromPoint(cx, cy).map(el => ({
          tag: el.tagName,
          className: el.className,
          id: el.id,
          zIndex: getComputedStyle(el).zIndex,
          position: getComputedStyle(el).position,
          overflow: getComputedStyle(el).overflow
        }));
        
        return {
          cx, cy,
          sRect,
          elements
        };
      })()`,
      returnByValue: true
    });
    console.log('STACK AT TOOLTIP POSITION:', JSON.stringify(stackInfo.result.value, null, 2));
    console.log('Saved tooltip_debug.png');

    ws.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run().catch(console.error);
