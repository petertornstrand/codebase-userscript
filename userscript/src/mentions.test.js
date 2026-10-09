import { beforeEach, describe, expect, it } from 'vitest';
import { addMentionUsers, mentionName, replaceMentions, shortName } from './mentions';

describe('shortName', () => {
    it.each([
        ['Vito Kasim', 'Vito K.'],
        ['Jenny Maria Thorell', 'Jenny T.'],
        ['Madonna', 'Madonna'],
        ['Åsa Öberg', 'Åsa Ö.'],
    ])('%s -> %s', (name, short) => {
        expect(shortName(name)).toBe(short);
    });
});

describe('mentionName', () => {
    const none = new Map();

    it('turns a handle with several parts into a name, without the number at the end', () => {
        expect(mentionName('@vito-kasim-31', none)).toBe('Vito K.');
        expect(mentionName('jenny.hermansson', none)).toBe('Jenny H.');
    });

    it('uses a name on the page that matches a handle without separators', () => {
        const names = new Map([['erikpetersen', 'Erik Petersen']]);
        expect(mentionName('erikpetersen', names)).toBe('Erik P.');
    });

    it('matches accents', () => {
        const names = new Map([['victorannergard', 'Victor Annergård']]);
        expect(mentionName('victor-annergard', names)).toBe('Victor A.');
        expect(mentionName('victorannergard', names)).toBe('Victor A.');
    });

    it('gives up on a single handle nobody on the page matches', () => {
        expect(mentionName('erikpetersen', none)).toBeNull();
    });
});

describe('replaceMentions', () => {
    beforeEach(() => {
        document.body.innerHTML = `
<div class="Post__header"><span class="text--bold"><a class="text--link">Erik Petersen</a></span></div>
<div class="styled-content">
  <p>Thanks <a href="/users/abc">@erikpetersen</a>, and <a href="/users/def">@vito-kasim-31</a>!</p>
  <p>Plain @lena-lindfors, mail me at ada@lovelace.com or see <code>@some-code-handle</code> and <a href="/x">@linked-handle</a>.</p>
</div>
<ul class="events"><li><div class="expansion"><p class="text">Hur ser det ut @jenny-hermansson-46 ?</p></div></li></ul>`;
        replaceMentions();
    });

    const mentions = () => [...document.querySelectorAll('.Mention')].map((m) => m.textContent);

    it('replaces linked and plain mentions with the name, keeping the handle as a tooltip', () => {
        expect(mentions()).toEqual(['@Erik P.', '@Vito K.', '@Lena L.', '@Jenny H.']);
        expect(document.querySelector('.Mention').title).toBe('@erikpetersen');
        expect(document.querySelector('a.Mention').getAttribute('href')).toBe('/users/abc');
    });

    it('leaves emails, code and other links alone', () => {
        const text = document.body.textContent;
        expect(text).toContain('ada@lovelace.com');
        expect(text).toContain('@some-code-handle');
        expect(text).toContain('@linked-handle');
    });

    it('is idempotent', () => {
        replaceMentions();
        expect(mentions().length).toBe(4);
        expect(document.querySelector('.Mention .Mention')).toBeNull();
    });

    it('uses the users from the API for the real name', () => {
        document.body.innerHTML = '<div class="styled-content"><p>Hi @lena-lindfors and @roger</p></div>';
        addMentionUsers([{ username: 'roger', fullName: 'Roger Eriksson' }, { username: 'lena-lindfors', fullName: 'Lena Lindfors-Berg' }]);
        expect(mentions()).toEqual(['@Lena L.', '@Roger E.']);
    });
});
