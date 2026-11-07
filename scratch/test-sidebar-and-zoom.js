const puppeteer = require('puppeteer-core');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://127.0.0.1:3000/app', { waitUntil: 'networkidle0' });

  // Wait for catalog and layout init
  await new Promise(r => setTimeout(r, 1500));

  // Reset theme to light if needed
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-ui-theme');
    localStorage.removeItem('theme');
  });
  await new Promise(r => setTimeout(r, 400));

  // Test Alt + Scroll Zoom
  const zoomTestResults = await page.evaluate(async () => {
    const viewport = document.querySelector('.canvas-viewport') || document.querySelector('.drawing-area');
    const zoomInput = document.querySelector('[data-zoom-value]') || document.querySelector('.canvas-scale-indicator');
    const initialZoom = zoomInput ? zoomInput.textContent || zoomInput.value : 'unknown';

    // Dispatch WheelEvent with altKey = true (scroll up = zoom in)
    const zoomInEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      altKey: true,
      deltaY: -120,
      clientX: 800,
      clientY: 500
    });
    viewport.dispatchEvent(zoomInEvent);

    await new Promise(r => setTimeout(r, 300));
    const zoomAfterIn = zoomInput ? zoomInput.textContent || zoomInput.value : 'unknown';

    // Dispatch WheelEvent with altKey = true (scroll down = zoom out)
    const zoomOutEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      altKey: true,
      deltaY: 120,
      clientX: 800,
      clientY: 500
    });
    viewport.dispatchEvent(zoomOutEvent);

    await new Promise(r => setTimeout(r, 300));
    const zoomAfterOut = zoomInput ? zoomInput.textContent || zoomInput.value : 'unknown';

    return { initialZoom, zoomAfterIn, zoomAfterOut };
  });

  console.log('Zoom test results with Alt + Wheel:', zoomTestResults);

  // Take screenshot of modern sidebar in light theme
  const artifactDir = 'C:\\Users\\lucas\\.gemini\\antigravity\\brain\\6b8907c1-bdac-4410-a96c-2e36ef9d27a9';
  await page.screenshot({
    path: path.join(artifactDir, 'sidebar_modern_light.png'),
    clip: { x: 0, y: 0, width: 420, height: 950 }
  });
  console.log('Light theme modern sidebar screenshot saved');

  // Toggle to dark theme
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="toggle-ui-theme"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Take screenshot of modern sidebar in dark theme
  await page.screenshot({
    path: path.join(artifactDir, 'sidebar_modern_dark.png'),
    clip: { x: 0, y: 0, width: 420, height: 950 }
  });
  console.log('Dark theme modern sidebar screenshot saved');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
