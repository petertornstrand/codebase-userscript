import { log } from './utils';

/**
 * Replaces Codebase's placeholder avatars (the grey silhouette people without
 * a picture get) with an avatar showing their initials.
 *
 * A placeholder is recognised by how it looks, a nearly grey, bright and flat
 * image, because its address isn't known. Real photos have colour or contrast.
 */

const SAMPLE = 16;

/**
 * Tell from the pixels of a small copy of an image whether it is the placeholder.
 *
 * @param {Uint8ClampedArray|number[]} pixels - RGBA data.
 * @return {boolean}
 */
export function looksLikePlaceholder(pixels) {
    const count = pixels.length / 4;
    if (!count) {
        return false;
    }
    let chroma = 0;
    let sum = 0;
    let sumSquares = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
        chroma += Math.max(r, g, b) - Math.min(r, g, b);
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        sum += luminance;
        sumSquares += luminance * luminance;
    }
    const mean = sum / count;
    const deviation = Math.sqrt(Math.max(0, sumSquares / count - mean * mean));
    return chroma / count < 8 && deviation < 30 && mean > 150;
}

/**
 * @param {string} name
 * @return {string} Up to two letters: the first letter of the first and the last word.
 */
export function initialsOf(name) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
        return '?';
    }
    const letters = words.length === 1 ? [...words[0]].slice(0, 2) : [[...words[0]][0], [...words[words.length - 1]][0]];
    return letters.join('').toUpperCase();
}

/**
 * @param {string} name
 * @return {number} A stable hue (0-359) for the name.
 */
export function hueOf(name) {
    let hash = 0;
    for (const char of name) {
        hash = (hash * 31 + char.charCodeAt(0)) % 360;
    }
    return hash;
}

const results = new Map();

/**
 * Load an image again, the way the browser allows reading its pixels, and check it.
 * The answer is cached by address. An image that can't be read is not a placeholder.
 *
 * @param {string} src
 * @return {Promise<boolean>}
 */
function isPlaceholderSource(src) {
    if (!results.has(src)) {
        results.set(src, new Promise((resolve) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = SAMPLE;
                    canvas.height = SAMPLE;
                    const context = canvas.getContext('2d', { willReadFrequently: true });
                    context.drawImage(image, 0, 0, SAMPLE, SAMPLE);
                    resolve(looksLikePlaceholder(context.getImageData(0, 0, SAMPLE, SAMPLE).data));
                } catch {
                    resolve(false);
                }
            };
            image.onerror = () => resolve(false);
            image.src = src;
        }));
    }
    return results.get(src);
}

/**
 * Find out whose avatar an image is, from the text around it.
 *
 * @param {HTMLImageElement} image
 * @return {string|null}
 */
export function avatarName(image) {
    if (image.dataset.name) {
        return image.dataset.name;
    }
    // Avatars rendered by the userscript's own components.
    if (image.closest('.Avatar') && image.alt) {
        return image.alt;
    }
    const memberLink = image.closest('.block-item__link');
    if (memberLink) {
        return memberLink.firstChild?.textContent.trim() || null;
    }
    const container = image.closest('li.event, .Post, .ThreadChanges__event, li');
    return container?.querySelector('.author a, .text--bold a.text--link, .text--bold')?.textContent.trim() || null;
}

/**
 * @param {HTMLImageElement} image
 * @param {string} name
 */
function replaceWithInitials(image, name) {
    const size = Math.round(image.getBoundingClientRect().width) || Number(image.getAttribute('width')) || 24;
    const hue = hueOf(name);
    const avatar = document.createElement('span');
    avatar.className = `${image.className} InitialsAvatar`.trim();
    avatar.textContent = initialsOf(name);
    avatar.title = name;
    avatar.setAttribute('aria-label', name);
    avatar.style.setProperty('--size', `${size}px`);
    avatar.style.setProperty('--hue', String(hue));
    image.replaceWith(avatar);
}

/**
 * Check the avatars below a node.
 *
 * @param {ParentNode} [root]
 * @return {Promise<void>}
 */
export async function replacePlaceholders(root = document) {
    const images = [...root.querySelectorAll('img.gravatar:not([data-avatar-checked])')];
    await Promise.all(images.map(async (image) => {
        image.dataset.avatarChecked = 'true';
        const name = avatarName(image);
        if (!name || !image.src) {
            return;
        }
        if (await isPlaceholderSource(image.src) && image.isConnected) {
            replaceWithInitials(image, name);
        }
    }));
}

/**
 * Replace the placeholder avatars on the page, and on content that is added later.
 */
let observing = false;

export default function initAvatars() {
    log('Initializing avatars');
    replacePlaceholders();
    // The page can be initialised again when the address changes, one observer is enough.
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
            replacePlaceholders();
        }, 200);
    }).observe(document.body, { childList: true, subtree: true });
}
