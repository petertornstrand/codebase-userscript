import { log } from './utils';

/**
 * Shows @mentions in comments as a name, "@Vito K.", instead of the handle,
 * "@vito-kasim-31".
 *
 * The name comes from, in this order:
 * 1. the users the API told us about (handle = username),
 * 2. a name on the page that matches the handle, like an author or a member,
 * 3. the handle itself when it has several parts: vito-kasim-31 becomes Vito K.
 * A handle that can't be turned into a name, like "erikpetersen" when nobody
 * with that name is on the page, is left as it is.
 */

const HANDLE = /@([a-z][a-z0-9._-]*[a-z0-9])/gi;

/** Handle (username) -> full name, from the API. */
const known = new Map();

/**
 * @param {string} value
 * @return {string} Only the letters, lower case and without accents.
 */
const letters = (value) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

/**
 * @param {string} fullName
 * @return {string} "Vito Kasim" -> "Vito K."
 */
export function shortName(fullName) {
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) {
        return fullName.trim();
    }
    return `${words[0]} ${[...words[words.length - 1]][0].toUpperCase()}.`;
}

const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * @param {string} handle - Without the @.
 * @return {string} The handle without a number at the end, in parts.
 */
const partsOf = (handle) => handle.replace(/[-_.]?\d+$/, '').split(/[-_.]+/).filter(Boolean);

/**
 * Names that can be read from the page: authors, commenters and members.
 *
 * @param {ParentNode} root
 * @return {Map<string, string>} Letters of the name -> the name.
 */
function namesOnPage(root = document) {
    const names = new Map();
    root.querySelectorAll('.author a, .text--bold a.text--link, .block-item__link, .Participant__list [title]').forEach((element) => {
        const name = (element.getAttribute('title') || element.firstChild?.textContent || element.textContent).trim();
        if (/^\p{L}[\p{L}'.-]*(\s+\p{L}[\p{L}'.-]*)+$/u.test(name) && !name.startsWith('@')) {
            names.set(letters(name), name);
        }
    });
    return names;
}

/**
 * @param {string} handle - With or without the @.
 * @param {Map<string, string>} [pageNames]
 * @return {string|null} The short name, or null when the handle can't be turned into one.
 */
export function mentionName(handle, pageNames = namesOnPage()) {
    const bare = handle.replace(/^@/, '');
    const fromApi = known.get(bare.toLowerCase());
    if (fromApi) {
        return shortName(fromApi);
    }
    const parts = partsOf(bare);
    const onPage = pageNames.get(letters(parts.join('')));
    if (onPage) {
        return shortName(onPage);
    }
    if (parts.length > 1) {
        return shortName(parts.map(capitalize).join(' '));
    }
    return null;
}

function mentionElement(handle, name, tag = 'span') {
    const element = document.createElement(tag);
    element.className = 'Mention';
    element.textContent = `@${name}`;
    element.title = `@${handle}`;
    return element;
}

/**
 * Replace the mentions in a piece of content.
 *
 * @param {Element} root
 * @param {Map<string, string>} pageNames
 */
function replaceIn(root, pageNames) {
    // Mentions that Codebase turned into a link to the profile.
    root.querySelectorAll('a[href*="/users/"]').forEach((link) => {
        const text = link.textContent.trim();
        if (!/^@[a-z][a-z0-9._-]*$/i.test(text) || link.classList.contains('Mention')) {
            return;
        }
        const name = mentionName(text, pageNames);
        if (name) {
            link.classList.add('Mention');
            link.title = text;
            link.textContent = `@${name}`;
        }
    });

    // Mentions in plain text.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => (node.parentElement.closest('a, code, pre, textarea, .Mention') || !node.nodeValue.includes('@')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }
    nodes.forEach((node) => {
        const text = node.nodeValue;
        const fragment = document.createDocumentFragment();
        let last = 0;
        let changed = false;
        for (const match of text.matchAll(HANDLE)) {
            const before = text[match.index - 1];
            const name = !before || /[\s([{>"']/.test(before) ? mentionName(match[1], pageNames) : null;
            if (!name) continue;
            fragment.append(text.slice(last, match.index), mentionElement(match[1], name));
            last = match.index + match[0].length;
            changed = true;
        }
        if (changed) {
            fragment.append(text.slice(last));
            node.replaceWith(fragment);
        }
    });
}

/**
 * Replace the mentions in comments and in the activity feed.
 *
 * @param {ParentNode} [root]
 */
export function replaceMentions(root = document) {
    const contents = [...root.querySelectorAll('.styled-content, .expansion p.text')];
    if (!contents.length) {
        return;
    }
    const pageNames = namesOnPage(root);
    contents.forEach((content) => replaceIn(content, pageNames));
}

/**
 * Tell about users from the API, so that their mentions get their real names.
 *
 * @param {{username?: string, fullName?: string}[]} users
 */
export function addMentionUsers(users) {
    (users ?? []).forEach((user) => {
        if (user?.username && user?.fullName) {
            known.set(user.username.toLowerCase(), user.fullName);
        }
    });
    replaceMentions();
}

let observing = false;

/**
 * Replace the mentions on the page, and on content that is added later.
 */
export default function initMentions() {
    log('Initializing mentions');
    replaceMentions();
    if (observing) {
        return;
    }
    observing = true;
    let pending = false;
    new MutationObserver(() => {
        if (pending) return;
        pending = true;
        setTimeout(() => {
            pending = false;
            replaceMentions();
        }, 200);
    }).observe(document.body, { childList: true, subtree: true });
}
