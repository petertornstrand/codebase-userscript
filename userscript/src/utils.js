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
