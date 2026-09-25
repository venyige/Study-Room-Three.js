// Loads the demo in headless Chromium (software WebGL) and fails on any
// JavaScript error, console error, WebGL GL_INVALID_* warning or failed
// request. Leaves a screenshot in test-results/ for a quick visual check.
// Run: npm run test:smoke   (first time: npx playwright install chromium)
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
const RENDER_WAIT_MS = 8000;
const TYPES = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png',
};

const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(root, urlPath));
    if (file.startsWith(root) && existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!file.startsWith(root) || !existsSync(file)) {
        res.writeHead(404).end();
        return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const url = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const problems = [];
try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
    // GL_INVALID_* arrives as a warning; it is how a broken render pass shows
    // up (e.g. a feedback loop, see .claude/rules/threejs-r74.md invariant 3).
    page.on('console', (msg) => {
        if (msg.type() === 'error' || /GL_INVALID_/.test(msg.text())) problems.push(`console ${msg.type()}: ${msg.text()}`);
    });
    page.on('response', (res) => { if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`); });
    page.on('requestfailed', (req) => problems.push(`request failed: ${req.url()}`));

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(RENDER_WAIT_MS);

    mkdirSync(join(root, 'test-results'), { recursive: true });
    await page.screenshot({ path: join(root, 'test-results/smoke.png'), timeout: 60000 });
} finally {
    await browser.close();
    server.close();
}

if (problems.length) {
    console.error([...new Set(problems)].join('\n'));
    process.exit(1);
}
console.log('smoke ok: page rendered without errors');
