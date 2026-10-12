/**
 * Wrapped console.log function.
 *
 * @export
 * @param {*} args
 */
export function log(...args) {
    console.log(
        '%cUserscript (React Mode):',
        'color: purple; font-weight: bold',
        ...args
    );
}

/**
 * Wrapped version of `fetch` that logs the output as it's being fetched.
 * It also specifies the full path, because in Greasemonkey, the full path is needed.
 *
 * @param {string} arg
 * @returns {Promise} - the `fetch` promise
 */
export function logFetch(arg) {
    const url = new URL(arg, window.location);
    log('fetching', '' + url);
    return fetch('' + url, { credentials: 'include' });
}

/**
 * Ensure `callback` is called every time window.location changes
 * Code derived from https://stackoverflow.com/questions/3522090/event-when-window-location-href-changes
 *
 * @export
 * @param {function} callback - function to be called when URL changes
 * @returns {MutationObserver} - MutationObserver that watches the URL
 */
export function addLocationChangeCallback(callback) {
    // Run the callback once right at the start.
    window.setTimeout(callback, 0);

    // Set up a `MutationObserver` to watch for changes in the URL.
    let oldHref = window.location.href;
    const observer = new MutationObserver((mutations) => {
        if (mutations.some(() => oldHref !== document.location.href)) {
            oldHref = document.location.href;
            callback();
        }
    });

    observer.observe(document.firstChild, { childList: true, subtree: true });
    return observer;
}

/**
 * Awaits for an element with the specified `selector` to be found
 * and then returns the selected dom node.
 * This is used to delay rendering a widget until its parent appears.
 *
 * @export
 * @param {string} selector
 * @returns {Element}
 */
export async function awaitElement(selector) {
    const MAX_TRIES = 60;
    let tries = 0;
    return new Promise((resolve, reject) => {
        function probe() {
            tries++;
            return document.querySelector(selector);
        }

        function delayedProbe() {
            if (tries >= MAX_TRIES) {
                log('Can\'t find element with selector', selector);
                reject();
                return;
            }
            const elm = probe();
            if (elm) {
                resolve(elm);
                return;
            }

            window.setTimeout(delayedProbe, 250);
        }

        delayedProbe();
    });
}

/**
 * @typedef {Object} GM_Notification
 * @property {object} message - The message object.
 * @property {string} message.title - The message title.
 * @property {string} message.text - The message text.
 * @property {string} [message.tag] - The message tag.
 */

/**
 * Send notification to browser.
 *
 * @param {GM_Notification} notification - The message object.
 *
 * @return {void}
 */
export function notify (notification)  {
    const defaultValues = { 'tag': 'harvest'};
    notification = Object.assign({}, defaultValues, notification)
    if (typeof GM_notification === 'function') {
        GM_notification(notification);
    }
    else if (typeof extensionNotify === 'function') {
        extensionNotify(notification);
    }
    else {
        console.log('Notify', notification);
    }
}

/**
 * Get URL context.
 *
 * @return {URLContext}
 */
export function getURLContext() {
    const url = new URL(window.location);
    const path = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
    return {
        id: path?.[3] || '3434',
        project_id: path?.[1] || 'ki-profile',
        account_id: url.host,
        url: url.href
    };
}

/**
 * The configuration keys, in the userscript manager's value storage or in
 * the extension's storage.
 */
export const CONFIG_KEYS = ['cbapi_key', 'cbapi_base_url', 'cb_username', 'cb_key'];

// Set by the browser extension, which can only read its storage asynchronously
// and so loads the config before the page code starts.
let extensionConfig = null;
let extensionNotify = null;
let extensionFetch = null;
let extensionLoadImage = null;

/**
 * Let the browser extension provide the config and notifications, which the
 * userscript manager provides as `GM_*` functions.
 *
 * The extension also provides `fetch` and `loadImage`, because Firefox applies
 * the page's CORS rules to requests from content scripts. Its background script
 * makes them instead, with the permissions in the manifest.
 *
 * @param {{config: CodebaseConfig, notify: function(object): void, fetch: typeof fetch, loadImage: function(string): Promise<string>}} platform
 */
export function setPlatform({ config, notify, fetch, loadImage }) {
    extensionConfig = config;
    extensionNotify = notify;
    extensionFetch = fetch;
    extensionLoadImage = loadImage;
}

/**
 * `fetch`, made by the extension's background script when running as one.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @return {Promise<Response>}
 */
export function request(url, options) {
    return (extensionFetch ?? fetch)(url, options);
}

/**
 * An address the browser can load the pixels of an image from. Usually the
 * address itself, but the extension has to fetch images from other sites.
 *
 * @param {string} src
 * @return {Promise<string>}
 */
export async function loadImage(src) {
    return extensionLoadImage ? extensionLoadImage(src) : src;
}

/**
 * Claim the page for the userscript or the browser extension, so that they
 * don't both decorate it. The marker is a DOM attribute, which both can see
 * (the extension's content script has its own JavaScript globals).
 *
 * @param {'userscript'|'extension'} [owner] Defaults to what is running.
 *
 * @return {boolean} False if the other one has already claimed the page.
 */
export function claimPage(owner = extensionNotify ? 'extension' : 'userscript') {
    const root = document.documentElement;
    const current = root.dataset.cbEnhancer;
    if (current && current !== owner) {
        log(`The ${current} is already running, the ${owner} stays disabled. Disable one of them.`);
        return false;
    }
    root.dataset.cbEnhancer = owner;
    return true;
}

/**
 * @typedef {Object} CodebaseConfig
 * @property {string} cbapi_key
 * @property {string} cbapi_base_url
 * @property {string} cb_username
 * @property {string} cb_key
 */

/**
 * Get Codebase config.
 *
 * @return {CodebaseConfig}
 */
export function getCodebaseConfig() {
    let values;
    if (typeof GM_getValues === 'function') {
        values = GM_getValues(CONFIG_KEYS);
    }
    else if (extensionConfig) {
        values = extensionConfig;
    }
    else {
        throw new Error('No Codebase API config found.');
    }
    CONFIG_KEYS.forEach((key) => {
        if (!values[key]) {
            throw new Error(`Missing configuration value for key ${key}.`);
        }
    });
    return Object.fromEntries(CONFIG_KEYS.map((key) => [key, values[key]]));
}

/**
 * Find the avatar image Codebase shows for a user in the ticket thread.
 *
 * The images are matched by the full name displayed next to them, in comments
 * and in ticket changes.
 *
 * @param {string} fullName
 *
 * @return {HTMLElement|null} The image, or the initials avatar that replaced it.
 */
export function findCodebaseAvatar(fullName) {
    // An avatar that was a placeholder is an initials avatar by now (see avatars.js), copy that too.
    const avatars = document.querySelectorAll('#content .Post__avatar, #content .ThreadChanges__avatar');
    return Array.from(avatars).find((avatar) => {
        const name = avatar.parentElement.querySelector('.text--bold > a.text--link');
        return name?.textContent.trim() === fullName;
    }) ?? null;
}


/**
 * Find the notification channels in Codebase's own Notifications popout.
 * A channel the user is subscribed to has the class `is-watch`, clicking the
 * link toggles it and Codebase saves the change.
 *
 * @export
 * @return {{element: HTMLElement, name: string, watching: boolean}[]}
 */
export function findNotificationChannels() {
    const names = { by_email: 'email', by_web: 'the notification centre' };
    return [...document.querySelectorAll('.js-notifications-window .js-notification-select')].map((element) => ({
        element,
        name: names[element.getAttribute('rel')] ?? element.querySelector('.repo-window__list-title')?.textContent.trim() ?? 'unknown',
        watching: element.classList.contains('is-watch'),
        rel: element.getAttribute('rel'),
    }));
}

/**
 * Keep only the tickets that are actually referenced in the ticket thread.
 *
 * The API can return tickets that nothing in the thread refers to, for example
 * the project's latest tickets when the ticket has no references at all. A
 * reference shows up on the page as a link to the ticket (Codebase turns `#123`
 * and ticket URLs into links) or as `#123` after a space in the text. The ticket itself is
 * never a reference.
 *
 * @export
 * @param {Array<{id: number}>} tickets
 * @param {number} ticketId - The ticket that is displayed.
 * @return {Array<{id: number}>}
 */
export function onlyMentionedTickets(tickets, ticketId) {
    const thread = document.querySelector('.Thread__timeline');
    if (!thread || !tickets?.length) {
        return [];
    }
    const mentioned = new Set();
    thread.querySelectorAll('a[href*="/tickets/"]').forEach((link) => {
        const match = link.getAttribute('href').match(/\/tickets\/(\d+)/);
        if (match) mentioned.add(Number(match[1]));
    });
    // Same rule as the gateway: a `#123` after a space or tab. A `#` at the start of a line is a Markdown heading.
    for (const match of thread.textContent.matchAll(/(?<=[^\S\r\n])#(\d{1,4})\b/g)) {
        mentioned.add(Number(match[1]));
    }
    return tickets.filter((ticket) => ticket.id !== ticketId && mentioned.has(Number(ticket.id)));
}
