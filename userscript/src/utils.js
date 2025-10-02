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
 * Send notification to browser.
 *
 * @param {object} message - The message object.
 * @param {string} message.title - The message title.
 * @param {string} message.text - The message text.
 * @param {string} [message.tag] - The message tag.
 * @return {void}
 */
export function notify (message)  {
    const defaultValues = { 'tag': 'harvest'};
    message = Object.assign({}, defaultValues, message)
    if (typeof GM_notification === 'function') {
        GM_notification(message);
    }
    else {
        console.log('Notify', message);
    }
}

/**
 * @typedef {Object} CodebaseConfig
 * @property {string} id - The ticket/milestone/repository ID
 * @property {string} project_id - The project ID
 * @property {string} account_id - The hostname
 * @property {string} url - The full URL
 */

/**
 *
 * @return {CodebaseConfig}
 */
export function getCodebaseConfig() {
    const url = new URL(window.location);
    const path = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
    return {
        id: path?.[3],
        project_id: path?.[1],
        account_id: url.host,
        url: url.href
    };
}

/**
 * @typedef {Object} HarvestConfig
 * @property {string} account_id
 * @property {string} access_token
 * @property {string} user_agent
 */

/**
 * Get Harvest config.
 *
 * @return {HarvestConfig}
 */
export function getHarvestConfig() {
    if (typeof GM_getValues === 'function') {
        const values = GM_getValues(['harvest_account_id', 'harvest_access_token', 'harvest_user_agent' ]);
        Object.entries(values).forEach(([key, value]) => {
            if (!value) {
                throw new Error(`Missing configuration value for key ${key}.`);
            }
        })
        return {
            account_id: values.harvest_account_id,
            access_token: values.harvest_access_token,
            user_agent: values.harvest_user_agent
        };
    }
    else {
        throw new Error('No Harvest API config found.');
    }

}

/**
 * @typedef {Object} CodebaseHarvestMapItem
 * @property {string} codebase_project_id
 * @property {string} harvest_project_id
 * @property {string} harvest_client_id
 */

/**
 * Get Codebase <> Harvest map.
 *
 * @param {string} codebaseProjectId
 * @return {Array<CodebaseHarvestMapItem>}
 */
export function getCodebaseHavestMap(codebaseProjectId) {
    if (typeof GM_getValue === 'function') {
        const value = GM_getValue(codebaseProjectId);
        if (!value) {
            throw new Error(`No mapping found for codebase project ID: ${codebaseProjectId}`);
        }
        const searchParams = new URLSearchParams(value);
        return {
            codebase_project_id: codebaseProjectId,
            harvest_project_id: searchParams.get('project_id'),
            harvest_client_id: searchParams.get('client_id'),
        }
    }
    else {
        throw new Error('No Codebase <> Harvest map config found.');
    }
}
