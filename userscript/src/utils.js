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
    if (typeof GM_getValues === 'function') {
        const values = GM_getValues(['cbapi_key', 'cbapi_base_url', 'cb_username', 'cb_key']);
        Object.entries(values).forEach(([key, value]) => {
            if (!value) {
                throw new Error(`Missing configuration value for key ${key}.`);
            }
        })
        return {
            cbapi_key: values.cbapi_key,
            cbapi_base_url: values.cbapi_base_url,
            cb_username: values.cb_username,
            cb_key: values.cb_key
        };
    }
    else {
        throw new Error('No Codebase API config found.');
    }

}

/**
 * Find the avatar image Codebase shows for a user in the ticket thread.
 *
 * The images are matched by the full name displayed next to them, in comments
 * and in ticket changes.
 *
 * @param {string} fullName
 *
 * @return {HTMLImageElement|null}
 */
export function findCodebaseAvatar(fullName) {
    const images = document.querySelectorAll('#content img.Post__avatar, #content img.ThreadChanges__avatar');
    return Array.from(images).find((img) => {
        const name = img.parentElement.querySelector('.text--bold > a.text--link');
        return name?.textContent.trim() === fullName;
    }) ?? null;
}
