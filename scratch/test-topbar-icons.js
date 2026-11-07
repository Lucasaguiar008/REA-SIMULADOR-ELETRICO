const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

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

  // Wait a little for runtime init
  await new Promise(r => setTimeout(r, 1500));

  // Light theme screenshot
  const artifactDir = 'C:\\Users\\lucas\\.gemini\\antigravity\\brain\\6b8907c1-bdac-4410-a96c-2e36ef9d27a9';
  await page.screenshot({
    path: path.join(artifactDir, 'topbar_modern_light.png'),
    clip: { x: 0, y: 0, width: 1600, height: 260 }
  });
  console.log('Light theme topbar screenshot saved');

  // Toggle to dark theme
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="toggle-ui-theme"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(artifactDir, 'topbar_modern_dark.png'),
    clip: { x: 0, y: 0, width: 1600, height: 260 }
  });
  console.log('Dark theme topbar screenshot saved');

  // Toggle sound to test muted state
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="sound"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({
    path: path.join(artifactDir, 'topbar_sound_muted_dark.png'),
    clip: { x: 0, y: 0, width: 1600, height: 260 }
  });
  console.log('Sound muted dark topbar screenshot saved');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
