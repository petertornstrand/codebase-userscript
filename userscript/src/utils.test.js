import { beforeEach, describe, expect, it } from 'vitest';
import { findCodebaseAvatar, onlyMentionedTickets } from './utils';

beforeEach(() => {
    document.body.innerHTML = `<div id="content">
        <div class="Post__header"><img class="Post__avatar" id="a"><span class="text--bold"><a class="text--link"> Ada Lovelace </a></span></div>
        <ul><li class="ThreadChanges__event"><img class="ThreadChanges__avatar" id="b"><span class="text--bold"><a class="text--link">Grace Hopper</a></span> changed it</li></ul>
    </div>`;
});

describe('findCodebaseAvatar', () => {
    it('finds the avatar of a commenter', () => {
        expect(findCodebaseAvatar('Ada Lovelace').id).toBe('a');
    });

    it('finds the avatar of a user who only changed the ticket', () => {
        expect(findCodebaseAvatar('Grace Hopper').id).toBe('b');
    });

    it('returns null for unknown users', () => {
        expect(findCodebaseAvatar('Nobody')).toBeNull();
    });

    it('finds the initials avatar that replaced a placeholder', () => {
        const image = document.getElementById('a');
        const initials = document.createElement('span');
        initials.className = 'Post__avatar InitialsAvatar';
        initials.id = 'initials';
        image.replaceWith(initials);
        expect(findCodebaseAvatar('Ada Lovelace').id).toBe('initials');
    });
});

describe('onlyMentionedTickets', () => {
    const tickets = [1, 2, 3, 42, 99].map((id) => ({ id }));

    const thread = (html) => {
        document.body.innerHTML = `<div class="Thread__timeline">${html}</div>`;
    };

    it('keeps tickets that are linked or mentioned in the thread', () => {
        thread('<p>See <a href="https://x.test/projects/acme/tickets/2">ticket</a> and #3.</p>');
        expect(onlyMentionedTickets(tickets, 42).map((t) => t.id)).toEqual([2, 3]);
    });

    it('drops tickets nothing refers to, like a fallback list of the latest tickets', () => {
        thread('<p>Numbers like 1 828 and 2 542 are not references.</p>');
        expect(onlyMentionedTickets(tickets, 42)).toEqual([]);
    });

    it('never returns the ticket itself', () => {
        thread('<p>This is #42.</p>');
        expect(onlyMentionedTickets(tickets, 42)).toEqual([]);
    });

    it('ignores a # at the start of a line, it is a Markdown heading', () => {
        thread('<h1>#2 Heading</h1><p>#3 first</p>');
        expect(onlyMentionedTickets(tickets, 42)).toEqual([]);
    });

    it('does not match a longer number', () => {
        thread('<p>Ticket #299 and #10000.</p>');
        expect(onlyMentionedTickets(tickets, 42)).toEqual([]);
    });

    it('returns nothing without a thread or tickets', () => {
        document.body.innerHTML = '';
        expect(onlyMentionedTickets(tickets, 42)).toEqual([]);
        thread('#1');
        expect(onlyMentionedTickets(undefined, 42)).toEqual([]);
    });
});
