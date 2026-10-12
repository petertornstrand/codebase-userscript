// @vitest-environment node
// Runs the built extension (content script and background script) against a
// simulated Codebase page. The bundle evaluates all its modules at once, which
// the unit tests (that import the modules one by one) can't catch, and it needs
// the background script for requests, since Firefox blocks them in content scripts.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import vm from 'vm';
import { JSDOM, VirtualConsole } from 'jsdom';
import { ticketPage } from '../test/fixtures';

const dist = resolve(__dirname, '../../../dist/extension/firefox');
const context = readFileSync(resolve(__dirname, '../../preview/mocks/context.json'), 'utf-8');
const settings = { cbapi_key: 'k', cbapi_base_url: 'https://api.example', cb_username: 'u', cb_key: 'c' };

const feed = `<div id="content"><div class="right"></div><ul id="feed">
    <li class="event"><p class="event"><span class="author"><a>Ada</a></span></p></li></ul></div>`;

/**
 * Run the built background script and return a function that sends it a message,
 * like the content script's `runtime.sendMessage`, and the requests it made.
 */
function startBackground(storage) {
    let listener;
    const requests = [];
    const fetchStub = async (url) => {
        requests.push(String(url));
        return {
            ok: true, status: 200, statusText: 'OK',
            text: async () => context,
            blob: async () => new Blob(['x'], { type: 'image/png' }),
        };
    };
    vm.runInNewContext(readFileSync(`${dist}/background.js`, 'utf-8'), {
        URL, Promise, String, Boolean, fetch: fetchStub,
        FileReader: class {
            readAsDataURL() {
                setTimeout(() => { this.result = 'data:image/png;base64,eA=='; this.onload(); }, 0);
            }
        },
        browser: {
            storage: { local: { get: async () => storage } },
            runtime: { onMessage: { addListener: (fn) => (listener = fn) }, onInstalled: { addListener() {} }, getURL: (path) => path },
            notifications: { create() {} },
            action: { onClicked: { addListener() {} } },
        },
    });
    return { requests, send: (message) => new Promise((done) => listener(message, {}, done)) };
}

/** Load the built content script into a page. */
async function openPage({ html, url, storage = settings, owner }) {
    const background = startBackground(storage);
    const errors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (error) => errors.push(error.message));
    const dom = new JSDOM(`<html><body>${html}</body></html>`, { url, runScripts: 'outside-only', virtualConsole });
    if (owner) {
        dom.window.document.documentElement.dataset.cbEnhancer = owner;
    }
    dom.window.Response = Response;
    dom.window.browser = {
        storage: { local: { get: async () => storage } },
        runtime: { sendMessage: background.send },
    };
    dom.window.eval(readFileSync(`${dist}/content.js`, 'utf-8'));
    return { document: dom.window.document, background, errors };
}

describe('built extension', () => {
    beforeAll(() => {
        execFileSync('node', ['scripts/build-extension.mjs', 'firefox'], { cwd: resolve(__dirname, '../..'), stdio: 'ignore' });
    }, 120_000);

    it('adds the activity summary to the dashboard', async () => {
        const { document, errors } = await openPage({ html: feed, url: 'https://code.happiness.se/' });
        await vi.waitFor(() => expect(document.querySelector('.DashboardSummary')).not.toBeNull());
        expect(document.documentElement.dataset.cbEnhancer).toBe('extension');
        expect(errors).toEqual([]);
    });

    it('loads the ticket through the background script', async () => {
        const { document, background, errors } = await openPage({
            html: ticketPage,
            url: 'https://code.happiness.se/projects/acme/tickets/3434',
        });
        await vi.waitFor(() => expect(document.body.textContent).toContain('Sprint 42'));
        expect(document.querySelector('[role="alert"]')).toBeNull();
        expect(background.requests).toContain('https://api.example/acme/ticket/3434/context');
        expect(errors).toEqual([]);
    });

    it('shows a notice on the ticket page without settings', async () => {
        const { document } = await openPage({
            html: ticketPage,
            url: 'https://code.happiness.se/projects/acme/tickets/3434',
            storage: {},
        });
        await vi.waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain('Missing configuration value'));
    });

    it('only makes requests to the configured gateway and to Gravatar', async () => {
        const { background } = await openPage({ html: feed, url: 'https://code.happiness.se/' });
        expect(await background.send({ type: 'fetch', url: 'https://evil.example/', options: {} }))
            .toEqual({ error: 'Not the configured API gateway.' });
        expect(await background.send({ type: 'image', src: 'https://evil.example/a.png' }))
            .toEqual({ error: 'Image host not allowed.' });
        expect(await background.send({ type: 'image', src: 'https://secure.gravatar.com/avatar/x' }))
            .toEqual({ dataUrl: 'data:image/png;base64,eA==' });
    });

    it('stays disabled when the userscript has the page', async () => {
        const { document } = await openPage({ html: feed, url: 'https://code.happiness.se/', owner: 'userscript' });
        // Give it the time it needs to add the summary, if it were running.
        await new Promise((done) => setTimeout(done, 300));
        expect(document.querySelector('.DashboardSummary')).toBeNull();
        expect(document.documentElement.dataset.cbEnhancer).toBe('userscript');
    });
});
