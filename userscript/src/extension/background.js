// Background script (a service worker in Chrome, an event page in Firefox).
// Everything here must be registered synchronously so it survives the worker
// being stopped and restarted.
//
// Requests are made here, not in the content script: Firefox applies the page's
// CORS rules to content scripts, while the background script is allowed to
// reach every host the extension has permission for.
import { ext } from './browser';

// Avatars come from Gravatar, which the manifest has permission for.
const IMAGE_HOSTS = /(^|\.)gravatar\.com$/;
const MAX_IMAGE_SIZE = 1024 * 1024;

/**
 * The API gateway is the only place the API credentials are sent to, so only
 * requests to the configured gateway are made.
 *
 * @param {string} url
 * @return {Promise<boolean>}
 */
async function isGatewayUrl(url) {
    const { cbapi_base_url: base } = await ext.storage.local.get('cbapi_base_url');
    return Boolean(base) && url.startsWith(`${base}/`);
}

async function handleFetch({ url, options }) {
    if (!(await isGatewayUrl(url))) {
        return { error: 'Not the configured API gateway.' };
    }
    const response = await fetch(url, options);
    return {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
    };
}

function toDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

async function handleImage({ src }) {
    const url = new URL(src);
    if (url.protocol !== 'https:' || !IMAGE_HOSTS.test(url.hostname)) {
        return { error: 'Image host not allowed.' };
    }
    const response = await fetch(url);
    const blob = await response.blob();
    if (!response.ok || !blob.type.startsWith('image/') || blob.size > MAX_IMAGE_SIZE) {
        return { error: 'Not a usable image.' };
    }
    return { dataUrl: await toDataUrl(blob) };
}

function handleNotify({ notification: { title, text, tag } }) {
    ext.notifications.create(tag ? `codebase-${tag}` : undefined, {
        type: 'basic',
        iconUrl: ext.runtime.getURL('icons/icon-128.png'),
        title: title ?? 'Codebase',
        message: text ?? '',
    });
}

const handlers = { notify: handleNotify, fetch: handleFetch, image: handleImage };

ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = handlers[message?.type];
    if (!handler) {
        return;
    }
    // `sendResponse` and `return true` work in both Firefox and Chrome.
    Promise.resolve()
        .then(() => handler(message))
        .then((result) => sendResponse(result ?? {}))
        .catch((error) => sendResponse({ error: String(error?.message ?? error) }));
    return true;
});

// Open the options page on first install, nothing works without the settings.
ext.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        ext.runtime.openOptionsPage();
    }
});

// The toolbar button opens the settings.
ext.action.onClicked.addListener(() => {
    ext.runtime.openOptionsPage();
});
