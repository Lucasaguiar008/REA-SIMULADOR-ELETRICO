const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'C:\\Users\\lucas\\.gemini\\antigravity\\brain\\6b8907c1-bdac-4410-a96c-2e36ef9d27a9';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  const userDataDir = path.join(OUT_DIR, 'scratch', 'chrome_profile_sidebar_' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9277',
    '--window-size=1680,1050',
    `--user-data-dir=${userDataDir}`,
    'http://127.0.0.1:3000/app?example=resid-simple-lamp'
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        targets = await getJson('http://127.0.0.1:9277/json');
        if (targets && targets.length > 0 && targets.find(t => t.type === 'page')) break;
      } catch (e) {}
    }
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

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
    await sleep(2500);

    // Ensure Light theme first, open sidebar and select "components" tab (LucasAguiar)
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (document.documentElement.getAttribute('data-ui-theme') === 'dark') {
          document.querySelector('[data-action="toggle-ui-theme"]')?.click();
        }
        const wb = document.querySelector('.workbench');
        if (wb) wb.classList.remove('sidebar-hidden');
        const tabBtn = document.querySelector('[data-library-tab="components"]');
        if (tabBtn) tabBtn.click();
      })()`,
      returnByValue: true
    });
    await sleep(600);

    // Check dimensions to verify tabs don't overflow
    const overflowCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const sidebar = document.querySelector('.component-sidebar');
        const tabs = document.querySelector('.library-tabs');
        const buttons = [...tabs.querySelectorAll('button')].map(b => ({
          text: b.querySelector('span')?.textContent,
          offsetWidth: b.offsetWidth,
          scrollWidth: b.scrollWidth
        }));
        return {
          sidebarClientWidth: sidebar?.clientWidth,
          tabsClientWidth: tabs?.clientWidth,
          tabsScrollWidth: tabs?.scrollWidth,
          overflows: tabs ? tabs.scrollWidth > tabs.clientWidth : false,
          buttons
        };
      })()`,
      returnByValue: true
    });
    console.log('TABS OVERFLOW CHECK (LIGHT):', JSON.stringify(overflowCheck.result.value, null, 2));

    // Test Alt + Scroll Zoom
    const zoomTest = await send('Runtime.evaluate', {
      awaitPromise: true,
      expression: `(async () => {
        const viewport = document.querySelector('.canvas-viewport') || document.querySelector('.drawing-area');
        const zoomInput = document.querySelector('.zoom-control input');
        const zoomOut = document.querySelector('.zoom-control output');
        const initialZoom = zoomInput ? Number(zoomInput.value) : null;

        // Dispatch Alt + Wheel Zoom IN (deltaY < 0)
        const evZoomIn = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          altKey: true,
          deltaY: -120,
          clientX: 800,
          clientY: 500
        });
        viewport.dispatchEvent(evZoomIn);

        await new Promise(r => setTimeout(r, 150));
        const zoomAfterIn = zoomInput ? Number(zoomInput.value) : null;

        // Dispatch Alt + Wheel Zoom OUT (deltaY > 0)
        const evZoomOut = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          altKey: true,
          deltaY: 120,
          clientX: 800,
          clientY: 500
        });
        viewport.dispatchEvent(evZoomOut);

        await new Promise(r => setTimeout(r, 150));
        const zoomAfterOut = zoomInput ? Number(zoomInput.value) : null;

        return { initialZoom, zoomAfterIn, zoomAfterOut, zoomOutputText: zoomOut ? zoomOut.value : null };
      })()`,
      returnByValue: true
    });
    console.log('ALT+ZOOM TEST RESULT:', JSON.stringify(zoomTest.result.value, null, 2));

    // Capture Light theme sidebar screenshot
    const shotLight = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 110,
        width: 380,
        height: 870,
        scale: 1
      }
    });
    fs.writeFileSync(path.join(OUT_DIR, 'sidebar_modern_light.png'), Buffer.from(shotLight.data, 'base64'));
    console.log('Saved sidebar_modern_light.png');

    // Switch to dark theme
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-action="toggle-ui-theme"]');
        if (btn) btn.click();
        const wb = document.querySelector('.workbench');
        if (wb) wb.classList.remove('sidebar-hidden');
        const tabBtn = document.querySelector('[data-library-tab="components"]');
        if (tabBtn) tabBtn.click();
        const domTitle = document.querySelector('.library-domain[data-library-domain="electrical"] .library-domain-title');
        if (domTitle && !domTitle.parentElement.classList.contains('open')) domTitle.click();
        const famTitle = document.querySelector('.library-domain[data-library-domain="electrical"] .library-family-title');
        if (famTitle && !famTitle.parentElement.classList.contains('open')) famTitle.click();
      })()`,
      returnByValue: true
    });
    await sleep(600);

    // Capture Dark theme sidebar screenshot
    const shotDark = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 110,
        width: 380,
        height: 870,
        scale: 1
      }
    });
    fs.writeFileSync(path.join(OUT_DIR, 'sidebar_modern_dark.png'), Buffer.from(shotDark.data, 'base64'));
    console.log('Saved sidebar_modern_dark.png');

    ws.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
