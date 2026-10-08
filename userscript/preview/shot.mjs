// Screenshot a preview page: node preview/shot.mjs <path> <out.png> [width] [height]
import { chromium } from 'playwright';

const [, , path = '/', out = 'shot.png', width = '1440', height = '900'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: +height } });
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && console.log('[console]', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.stack));
await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: out, fullPage: process.env.FULL === '1' });
await browser.close();
