import { beforeEach, describe, expect, it } from 'vitest';
import initTickets from './tickets';
import { ticketPage } from '../test/fixtures';

beforeEach(() => {
    document.body.innerHTML = ticketPage;
});

describe('comments with tasks', () => {
    it('marks only comments that contain todo items', () => {
        initTickets();
        const marked = [...document.querySelectorAll('.Post--full.has-tasks')].map((e) => e.id);
        expect(marked).toEqual(['post-2']);
    });
});
