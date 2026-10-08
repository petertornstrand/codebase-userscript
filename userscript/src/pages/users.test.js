import { beforeEach, describe, expect, it } from 'vitest';
import initUsers from './users';
import { userActivity } from '../test/fixtures';

// jsdom does not implement innerText, which the script relies on.
beforeEach(() => {
    if (!('innerText' in HTMLElement.prototype)) {
        Object.defineProperty(HTMLElement.prototype, 'innerText', {
            configurable: true,
            get() { return this.textContent; },
        });
    }
    document.body.innerHTML = userActivity;
});

describe('tickets worked on today', () => {
    it('groups tickets per project and removes duplicates', () => {
        initUsers();
        const groups = [...document.querySelectorAll('.UserTickets')];
        const summary = Object.fromEntries(groups.map((g) => [
            g.querySelector('h2').textContent,
            [...g.querySelectorAll('li')].map((li) => li.textContent),
        ]));
        expect(summary).toEqual({
            Acme: ['#1 Fix login', '#3 Update footer'],
            Globex: ['#2 New landing page'],
        });
    });

    it('does not add the list twice', () => {
        initUsers();
        initUsers();
        expect(document.querySelectorAll('.UserTickets')).toHaveLength(2);
    });

    it('does nothing without an activity feed', () => {
        document.body.innerHTML = '';
        expect(() => initUsers()).not.toThrow();
    });
});
