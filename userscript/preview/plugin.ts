import * as fs from 'fs';
import * as path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

const previewDir = __dirname;
const pageDirs = [path.join(previewDir, 'pages'), path.join(previewDir, 'samples')];
const mocksDir = path.join(previewDir, 'mocks');

type Page = { file: string; dir: string; urlPath: string | null; sample: boolean };

/**
 * Work out which Codebase URL a saved page belongs to.
 *
 * Uses the "saved from url" comment that browsers add when saving a page (or
 * the url comment written by the SingleFile extension),
 * then falls back to `preview/pages.json` ({ "file.html": "/projects/x/tickets/1" }).
 */
function detectPath(file: string, html: string): string | null {
    let manifest: Record<string, string> = {};
    try {
        manifest = JSON.parse(fs.readFileSync(path.join(previewDir, 'pages.json'), 'utf-8'));
    } catch { /* optional */ }
    if (manifest[file]) {
        return manifest[file];
    }
    const saved = html.match(/<!--\s*saved from url=\(\d+\)(\S+)\s*-->/i);
    // The SingleFile extension writes "url: <address>" in a comment at the top.
    const singleFile = html.match(/<!--\s*Page saved with SingleFile\s+url:\s*(\S+)/i);
    const address = saved?.[1] ?? singleFile?.[1];
    if (address) {
        try { return new URL(address).pathname.replace(/\/+$/, '') || '/'; } catch { /* ignore */ }
    }
    return null;
}

function listPages(): Page[] {
    const pages: Page[] = [];
    for (const dir of pageDirs) {
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir)) {
            if (!/\.html?$/i.test(file)) continue;
            const html = fs.readFileSync(path.join(dir, file), 'utf-8');
            pages.push({ file, dir, urlPath: detectPath(file, html), sample: dir.endsWith('samples') });
        }
    }
    return pages;
}

/** Prepare a saved page: drop Codebase's own scripts, fix relative URLs, inject the userscript. */
function transformPage(html: string, keepScripts: boolean): string {
    if (!keepScripts) {
        html = html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
    }
    // A page saved while the userscript was running contains the userscript's own CSS
    // (and SingleFile markers inside it). Drop it, the preview injects the live version.
    html = html.replace(/<style\b[^>]*>(?:(?!<\/style>)[\s\S])*?generate-icons\.mjs[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<br hidden data-single-file-hidden-content>/gi, '');
    // ...and its loading flag, if the page was saved while the ticket was still loading.
    html = html.replace(/\bcb-ticket-loading\b/g, '');
    // Saved pages can carry a Content Security Policy that blocks our scripts.
    html = html.replace(/<meta\b[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
    // Relative asset URLs (saved "complete" pages) are served from /__pages/.
    html = html.replace(
        /(\s(?:src|href))=(["'])(?!\/|#|https?:|data:|mailto:|javascript:|about:)([^"']+)\2/gi,
        (_m, attr, quote, url) => `${attr}=${quote}/__pages/${url}${quote}`
    );
    const inject = '<script src="/preview/shim.js"></script>';
    html = /<head[^>]*>/i.test(html)
        ? html.replace(/<head[^>]*>/i, (m) => `${m}${inject}`)
        : inject + html;
    const entry = '<script type="module" src="/src/index.jsx"></script>';
    return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${entry}</body>`) : html + entry;
}

function indexPage(pages: Page[]): string {
    const rows = pages.map((p) => p.urlPath
        ? `<li><a href="${p.urlPath}">${p.urlPath}</a> <small>${p.file}${p.sample ? ' (sample)' : ''}</small></li>`
        : `<li>${p.file} <small>no URL found: add it to preview/pages.json</small></li>`);
    return `<!doctype html><meta charset="utf-8"><title>Preview</title>
<body style="font:15px sans-serif;max-width:720px;margin:40px auto">
<h1>Userscript preview</h1>
<p>Saved pages from <code>preview/pages/</code> with the userscript injected. Edit the source and the page reloads.</p>
<ul>${rows.join('') || '<li>No pages found.</li>'}</ul></body>`;
}

/** Mock Codebase API Gateway. */
function handleApi(url: URL, res: any): void {
    const send = (status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
    };
    const context = url.pathname.match(/^\/__api\/[^/]+\/ticket\/([^/]+)\/context$/);
    if (context) {
        // preview/mocks/context-<id>.json overrides preview/mocks/context.json.
        const candidates = [`context-${context[1]}.json`, 'context.json'].map((f) => path.join(mocksDir, f));
        const file = candidates.find((f) => fs.existsSync(f));
        const delay = Number(url.searchParams.get('delay') ?? 0);
        setTimeout(() => file ? send(200, JSON.parse(fs.readFileSync(file, 'utf-8'))) : send(404, { error: 'no mock' }), delay);
        return;
    }
    if (/\/(assignments|statuses|categories|priorities|types)$/.test(url.pathname)) {
        return send(200, []);
    }
    send(404, { error: `No mock for ${url.pathname}` });
}

export function previewPlugin(): Plugin {
    return {
        name: 'userscript-preview',
        apply: 'serve',
        configureServer(server: ViteDevServer) {
            // Reload when saved pages or mocks change.
            server.watcher.add([...pageDirs, mocksDir, path.join(previewDir, 'pages.json')]);
            server.watcher.on('change', (file) => {
                if (file.startsWith(previewDir)) {
                    server.ws.send({ type: 'full-reload' });
                }
            });

            server.middlewares.use(async (req, res, next) => {
                if (req.method !== 'GET' || !req.url) return next();
                const url = new URL(req.url, 'http://localhost');

                if (url.pathname.startsWith('/__api/')) {
                    return handleApi(url, res);
                }

                if (url.pathname.startsWith('/__pages/')) {
                    const rel = decodeURIComponent(url.pathname.slice('/__pages/'.length));
                    for (const dir of pageDirs) {
                        const file = path.join(dir, rel);
                        if (file.startsWith(dir) && fs.existsSync(file) && fs.statSync(file).isFile()) {
                            return void fs.createReadStream(file).pipe(res);
                        }
                    }
                    res.statusCode = 404;
                    return void res.end();
                }

                const pages = listPages();
                const wanted = url.pathname.replace(/\/+$/, '') || '/';
                // A saved dashboard (at `/`) takes over the root, the index is then at /__preview.
                const rootSaved = pages.some((p) => p.urlPath === '/');
                if (wanted === '/__preview' || (wanted === '/' && !rootSaved)) {
                    res.setHeader('Content-Type', 'text/html');
                    return void res.end(await server.transformIndexHtml(req.url, indexPage(pages)));
                }

                // Saved pages in preview/pages win over samples. When several pages share a URL,
                // `?page=<file name>` picks one of them.
                const byName = url.searchParams.get('page');
                const page = (byName && pages.find((p) => p.file === byName && p.urlPath === wanted))
                    || pages.find((p) => p.urlPath === wanted);
                if (page) {
                    const html = fs.readFileSync(path.join(page.dir, page.file), 'utf-8');
                    const out = transformPage(html, url.searchParams.has('js'));
                    res.setHeader('Content-Type', 'text/html');
                    return void res.end(await server.transformIndexHtml(req.url, out));
                }
                next();
            });
        },
    };
}
