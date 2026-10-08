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
    Avatar: () => null,
    DecoratedAvatars: () => null,
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
});
