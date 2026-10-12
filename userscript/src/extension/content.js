// Content script entry. Loads the settings from the extension storage, hands
// them to the page code and then starts it.
import { ext } from './browser';
import { CONFIG_KEYS, claimPage, setPlatform } from '../utils';
import { start } from '../index.jsx';

async function main() {
    // Synchronously, before the userscript (which runs at document end) can.
    if (!claimPage('extension')) {
        return;
    }

    const config = await ext.storage.local.get(CONFIG_KEYS);

    setPlatform({
        config,
        // Content scripts can't create notifications, the background script does.
        notify: (notification) => {
            ext.runtime.sendMessage({ type: 'notify', notification });
        },
        fetch: async (url, options = {}) => {
            const { method, headers, body } = options;
            const result = await ext.runtime.sendMessage({ type: 'fetch', url, options: { method, headers, body } });
            if (result.error) {
                throw new TypeError(result.error);
            }
            // These statuses can't have a body.
            const noBody = [101, 204, 205, 304].includes(result.status);
            return new Response(noBody ? null : result.body, { status: result.status, statusText: result.statusText });
        },
        loadImage: async (src) => {
            // Same site images can be read directly.
            if (new URL(src, location.href).origin === location.origin) {
                return src;
            }
            const result = await ext.runtime.sendMessage({ type: 'image', src });
            if (result.error) {
                throw new Error(result.error);
            }
            return result.dataUrl;
        },
    });

    // Run at document end like a userscript does: page improvements such as the
    // dashboard summary read the page once, so it has to be parsed by then.
    if (document.readyState === 'loading') {
        await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }

    start();
}

main();
