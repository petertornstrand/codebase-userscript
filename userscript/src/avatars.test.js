import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avatarName, hueOf, initialsOf, looksLikePlaceholder, replacePlaceholders } from './avatars';

const pixels = (rgb, count = 256) => Array.from({ length: count }, () => [...rgb, 255]).flat();

describe('looksLikePlaceholder', () => {
    it('recognises a bright, grey and flat image', () => {
        const data = [...pixels([232, 232, 232], 200), ...pixels([200, 200, 200], 56)];
        expect(looksLikePlaceholder(data)).toBe(true);
    });

    it('does not take a photo for a placeholder', () => {
        const data = [...pixels([180, 120, 90], 128), ...pixels([30, 40, 60], 128)];
        expect(looksLikePlaceholder(data)).toBe(false);
    });

    it('does not take a black and white image with contrast for a placeholder', () => {
        const data = [...pixels([255, 255, 255], 128), ...pixels([0, 0, 0], 128)];
        expect(looksLikePlaceholder(data)).toBe(false);
    });

    it('does not take a transparent or dark image for a placeholder', () => {
        expect(looksLikePlaceholder(new Uint8ClampedArray(1024))).toBe(false);
        expect(looksLikePlaceholder([])).toBe(false);
    });
});

describe('initialsOf', () => {
    it.each([
        ['Victor Annergård', 'VA'],
        ['Victor A', 'VA'],
        ['KI Deploy', 'KD'],
        ['Jenny Maria Thorell', 'JT'],
        ['Madonna', 'MA'],
        ['  ', '?'],
    ])('%s -> %s', (name, initials) => {
        expect(initialsOf(name)).toBe(initials);
    });
});

describe('hueOf', () => {
    it('is stable and within the colour wheel', () => {
        expect(hueOf('Ada Lovelace')).toBe(hueOf('Ada Lovelace'));
        expect(hueOf('Ada Lovelace')).toBeGreaterThanOrEqual(0);
        expect(hueOf('Ada Lovelace')).toBeLessThan(360);
    });
});

describe('avatarName', () => {
    it('finds the name in a feed event, a member list and a comment', () => {
        document.body.innerHTML = `
<ul><li class="event"><img id="a" class="gravatar"><p class="event"><span class="author"><a>Ada L</a></span></p></li></ul>
<ul><li class="block-item"><a class="block-item__link">Grace Hopper<img id="b" class="gravatar"></a></li></ul>
<div class="Post"><img id="c" class="gravatar Post__avatar"><div class="Post__header"><span class="text--bold"><a class="text--link">Alan Turing</a></span></div></div>
<div class="Avatar"><img id="d" class="gravatar" alt="Edsger Dijkstra"></div>`;
        const name = (id) => avatarName(document.getElementById(id));
        expect([name('a'), name('b'), name('c'), name('d')]).toEqual(['Ada L', 'Grace Hopper', 'Alan Turing', 'Edsger Dijkstra']);
    });
});

describe('replacePlaceholders', () => {
    let placeholder = true;

    beforeEach(() => {
        placeholder = true;
        vi.stubGlobal('Image', class {
            set src(value) {
                this._src = value;
                setTimeout(() => this.onload?.());
            }
        });
        const context = {
            drawImage: () => {},
            getImageData: () => ({ data: placeholder ? pixels([230, 230, 230]) : pixels([200, 40, 40]) }),
        };
        const create = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tag, ...rest) => {
            const el = create(tag, ...rest);
            if (tag === 'canvas') el.getContext = () => context;
            return el;
        });
        document.body.innerHTML = '<ul><li class="event"><img class="gravatar" src="https://x.test/blank.jpg?1"><span class="author"><a>Ada Lovelace</a></span></li></ul>';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('replaces a placeholder with the initials of the person', async () => {
        await replacePlaceholders();
        const avatar = document.querySelector('.InitialsAvatar');
        expect(avatar.textContent).toBe('AL');
        expect(avatar.title).toBe('Ada Lovelace');
        expect(document.querySelector('img.gravatar')).toBeNull();
    });

    it('keeps a real picture', async () => {
        placeholder = false;
        document.querySelector('img').src = 'https://x.test/photo.jpg?2';
        await replacePlaceholders();
        expect(document.querySelector('.InitialsAvatar')).toBeNull();
        expect(document.querySelector('img.gravatar')).not.toBeNull();
    });
});
