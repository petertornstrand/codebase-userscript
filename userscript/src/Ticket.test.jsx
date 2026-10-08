import React from 'react';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { QueryClient, QueryClientProvider } from 'react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ticketPage, ticketContext } from './test/fixtures';

// Global.jsx reads userscript-manager config at import time and talks to the
// API gateway, so replace it with stubs.
vi.mock('./Global', () => ({
    api: { getContext: vi.fn(async () => ticketContext) },
    dateFormat: {},
    dateTimeFormat: {},
    Avatar: ({ user, source }) => <span className="MockAvatar" data-name={user.fullName} data-has-source={source ? 'yes' : 'no'} />,
    DecoratedTicketLinks: () => null,
}));

import Ticket from './Ticket';
import { api } from './Global';

const flush = () => new Promise((resolve) => setTimeout(resolve, 50));

beforeEach(() => {
    document.body.innerHTML = ticketPage + '<div id="app"></div>';
    window.history.pushState({}, '', '/projects/acme/tickets/42');
    Object.defineProperty(HTMLElement.prototype, 'innerText', {
        configurable: true,
        get() { return this.textContent; },
        set(v) { this.textContent = v; },
    });
});

async function mount() {
    const client = new QueryClient();
    await act(async () => {
        render(
            <QueryClientProvider client={client} contextSharing={false}><Ticket /></QueryClientProvider>,
            document.getElementById('app')
        );
        await flush();
    });
    await act(flush);
}

describe('Ticket', () => {
    it('replaces the thread header with the ticket subject', async () => {
        await mount();
        expect(document.querySelector('.Thread__header')).toBeNull();
        expect(document.querySelector('#ticket-subject').textContent).toContain('#42');
        expect(document.querySelector('#ticket-subject').textContent).toContain('Fix the thing');
    });

    it('renders the sidebar with branch and tags', async () => {
        await mount();
        const sidebar = document.querySelector('.TicketSidebarComponent');
        expect(sidebar).not.toBeNull();
        expect(sidebar.textContent).toContain('42-fix-the-thing');
        expect(sidebar.textContent).toContain('misc');
    });

    it('scrolls the last comment into view', async () => {
        const spy = vi.fn();
        document.getElementById('post-3').scrollIntoView = spy;
        await mount();
        [...document.querySelectorAll('button')].find((b) => b.textContent === 'Last comment').click();
        expect(spy).toHaveBeenCalled();
    });

    it('leaves the original page and shows a notice when the API fails', async () => {
        api.getContext.mockResolvedValueOnce(undefined);
        await mount();
        expect(document.querySelector('[role="alert"]').textContent).toContain('could not load ticket data');
        expect(document.querySelector('.Thread__header')).not.toBeNull();
        expect(document.querySelector('.TicketSidebarComponent')).toBeNull();
    });

    it('renders tickets without a milestone', async () => {
        const { milestone, ...ticket } = ticketContext.ticket;
        api.getContext.mockResolvedValueOnce({ ...ticketContext, ticket });
        await mount();
        expect(document.querySelector('#ticket-subject')).not.toBeNull();
        expect(document.querySelector('.TicketSidebarComponent').textContent).not.toContain('Milestone');
    });

    it('leaves the avatars in the thread alone', async () => {
        document.getElementById('post-1').insertAdjacentHTML(
            'afterbegin',
            '<div class="Post__header"><img class="Post__avatar" src="x.png"><span class="text--bold"><a class="text--link">Ada Lovelace</a></span></div>'
        );
        await mount();
        expect(document.querySelector('img.Post__avatar')).not.toBeNull();
    });

    describe('actions menu', () => {
        const menu = () => document.querySelector('.ActionsMenu__menu');
        const button = () => document.querySelector('.ActionsMenu__button');

        it('moves the original action links into a closed menu', async () => {
            await mount();
            expect(menu().querySelectorAll('a')).toHaveLength(2);
            expect(menu().hidden).toBe(true);
            expect(document.querySelector('.sidebar__module.userscript-hidden')).not.toBeNull();
        });

        it('opens on click and closes on Escape and outside click', async () => {
            await mount();
            await act(async () => button().click());
            expect(menu().hidden).toBe(false);
            expect(button().getAttribute('aria-expanded')).toBe('true');

            await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
            expect(menu().hidden).toBe(true);

            await act(async () => button().click());
            await act(async () => document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
            expect(menu().hidden).toBe(true);
        });
    });

    describe('access property', () => {
        const access = () => document.querySelector('.TicketProperties__column--access');

        it('lists public tickets as a property and hides the notice', async () => {
            await mount();
            expect(access().textContent).toBe('AccessPublic');
            expect(access().querySelector('.TicketProperties__value').title).toContain('viewed by anyone');
            expect(document.querySelector('.box--positive').closest('.sidebar__module').classList.contains('userscript-hidden')).toBe(true);
        });

        it('lists any other ticket as private', async () => {
            document.querySelector('.box--positive').className = 'box box--negative';
            document.querySelector('.sidebar__content').textContent = 'This ticket is private. Only users in from Happiness can view and contribute to this ticket. ';
            await mount();
            expect(access().textContent).toBe('AccessPrivate');
            expect(access().querySelector('.TicketProperties__value').title).toContain('Only users in from Happiness');
            expect(access().querySelector('.TicketProperties__tag')).not.toBeNull();
        });

        it('handles the real private notice markup', async () => {
            document.querySelector('.box--positive').className = 'box box--negative';
            document.querySelector('.sidebar__content').outerHTML = `<div class="sidebar__content text--negative">
This ticket is private.
Only users in from <span class="text--bold">Happiness</span> can view and contribute
to this ticket.
</div>`;
            await mount();
            expect(access().textContent).toBe('AccessPrivate');
            expect(access().querySelector('.TicketProperties__value').title)
                .toBe('This ticket is private. Only users in from Happiness can view and contribute to this ticket.');
            expect(document.querySelector('.box--negative').closest('.sidebar__module').classList.contains('userscript-hidden')).toBe(true);
        });

        it('lists the ticket as private based on the text even in a positive box', async () => {
            document.querySelector('.sidebar__content').textContent = 'This ticket is private. Only users in from Happiness can view and contribute to this ticket.';
            await mount();
            expect(access().textContent).toBe('AccessPrivate');
        });

        it('does nothing when the notice is missing', async () => {
            document.querySelector('.box--positive').closest('.sidebar__module').remove();
            await mount();
            expect(access()).toBeNull();
        });
    });

    it('gives participants the avatar Codebase shows for them in the thread', async () => {
        document.getElementById('post-1').insertAdjacentHTML(
            'afterbegin',
            '<div class="Post__header"><img class="Post__avatar" src="ada.png"><span class="text--bold"><a class="text--link">Ada Lovelace</a></span></div>'
        );
        await mount();
        const avatars = Object.fromEntries([...document.querySelectorAll('.MockAvatar')].map((a) => [a.dataset.name, a.dataset.hasSource]));
        expect(avatars).toEqual({ 'Ada Lovelace': 'yes', 'Grace Hopper': 'no' });
    });
});
