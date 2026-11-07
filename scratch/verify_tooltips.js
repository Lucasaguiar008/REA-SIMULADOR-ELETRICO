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
  const userDataDir = path.join(OUT_DIR, 'scratch', 'chrome_profile_tooltips_' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9311',
    '--window-size=1680,1050',
    `--user-data-dir=${userDataDir}`,
    'http://127.0.0.1:3000/app?example=resid-simple-lamp'
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        targets = await getJson('http://127.0.0.1:9311/json');
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

    // Ensure Light theme first
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (document.documentElement.getAttribute('data-ui-theme') === 'dark') {
          document.querySelector('[data-action="toggle-ui-theme"]')?.click();
        }
      })()`,
      returnByValue: true
    });
    await sleep(500);

    // Hover mouse over the "save" button
    const btnSaveBox = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.tool-group button[data-action="save"]');
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`,
      returnByValue: true
    });

    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: btnSaveBox.result.value.x,
      y: btnSaveBox.result.value.y
    });
    await sleep(400);

    // Inspect small coordinates and element under it
    const lightCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.tool-group button[data-action="save"]');
        const small = btn.querySelector('small');
        const sRect = small.getBoundingClientRect();
        const hit = document.elementFromPoint(sRect.left + sRect.width/2, sRect.top + sRect.height/2);
        return {
          btnRect: btn.getBoundingClientRect(),
          smallRect: sRect,
          hitTag: hit?.tagName,
          hitClass: hit?.className,
          isSmallVisible: hit === small || small.contains(hit),
          smallComputedDisplay: getComputedStyle(small).display,
          smallComputedZIndex: getComputedStyle(small).zIndex
        };
      })()`,
      returnByValue: true
    });
    console.log('LIGHT TOOLTIP CHECK:', JSON.stringify(lightCheck.result.value, null, 2));

    const shotLight = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 60,
        width: 700,
        height: 250,
        scale: 1
      }
    });
    fs.writeFileSync(path.join(OUT_DIR, 'tooltip_hover_light.png'), Buffer.from(shotLight.data, 'base64'));
    console.log('Saved tooltip_hover_light.png');

    // Switch to dark theme
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-action="toggle-ui-theme"]');
        if (btn) btn.click();
      })()`,
      returnByValue: true
    });
    await sleep(500);

    // Hover mouse over "save" button again in dark theme
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: btnSaveBox.result.value.x,
      y: btnSaveBox.result.value.y
    });
    await sleep(400);

    const shotDark = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 60,
        width: 700,
        height: 250,
        scale: 1
      }
    });
    fs.writeFileSync(path.join(OUT_DIR, 'tooltip_hover_dark.png'), Buffer.from(shotDark.data, 'base64'));
    console.log('Saved tooltip_hover_dark.png');

    ws.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run().catch(console.error);
