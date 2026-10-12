// Options page. Plain DOM code, the page is too small to need Preact.
import { ext } from './browser';
import { CONFIG_KEYS } from '../utils';

const form = document.getElementById('form');
const status = document.getElementById('status');

ext.storage.local.get(CONFIG_KEYS).then((values) => {
    CONFIG_KEYS.forEach((key) => {
        form.elements[key].value = values[key] ?? '';
    });
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const config = Object.fromEntries(
        CONFIG_KEYS.map((key) => [key, form.elements[key].value.trim()])
    );
    config.cbapi_base_url = config.cbapi_base_url.replace(/\/+$/, '');
    status.textContent = '';

    // The background script calls the gateway, which needs the browser's
    // permission. Must be asked straight from the click, before anything is awaited.
    const granted = await ext.permissions.request({ origins: [`${new URL(config.cbapi_base_url).origin}/*`] });
    if (!granted) {
        status.textContent = 'Not saved: access to the API gateway was not allowed.';
        return;
    }
    await ext.storage.local.set(config);
    status.textContent = 'Saved. Reload open Codebase tabs.';
});
