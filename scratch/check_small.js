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
  const userDataDir = path.join(OUT_DIR, 'scratch', 'chrome_profile_check_' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9299',
    '--window-size=1680,1050',
    `--user-data-dir=${userDataDir}`,
    'http://127.0.0.1:3000/app'
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        targets = await getJson('http://127.0.0.1:9299/json');
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

    // Deep inspect small element
    const deep = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.tool-group button[data-action="save"]');
        const small = btn.querySelector('small');
        
        return {
          smallExists: Boolean(small),
          parentElement: small.parentElement.tagName,
          offsetWidth: small.offsetWidth,
          offsetHeight: small.offsetHeight,
          clientRect: small.getBoundingClientRect(),
          computedStyle: {
            display: getComputedStyle(small).display,
            visibility: getComputedStyle(small).visibility,
            opacity: getComputedStyle(small).opacity,
            position: getComputedStyle(small).position,
            top: getComputedStyle(small).top,
            left: getComputedStyle(small).left,
            transform: getComputedStyle(small).transform,
            zIndex: getComputedStyle(small).zIndex,
            clip: getComputedStyle(small).clip,
            clipPath: getComputedStyle(small).clipPath
          }
        };
      })()`,
      returnByValue: true
    });
    console.log('DEEP SMALL INSPECT:', JSON.stringify(deep.result.value, null, 2));

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 60,
        width: 700,
        height: 250,
        scale: 1
      }
    });
    fs.writeFileSync(path.join(OUT_DIR, 'tooltip_fixed_test.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved tooltip_fixed_test.png');

    ws.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run().catch(console.error);
