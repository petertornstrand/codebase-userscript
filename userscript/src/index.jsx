import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import './styles/Global.css';
import './styles/Modern.css';
import './styles/Icons.css';
import Notice from './Notice';
import initProjects from './pages/projects';
import initTickets from './pages/tickets';
import initUsers from './pages/users';
import { awaitElement, log, addLocationChangeCallback } from './utils';

log('React script has successfully started');

/**
 * Render the React ticket components.
 *
 * The ticket module is loaded on demand since it requires API configuration
 * that the other pages do not need.
 */
async function renderTicket() {
    let target = await awaitElement('body');
    let container = document.createElement('div');
    target.appendChild(container);
    let root = createRoot(container);

    let Ticket;
    try {
        ({ default: Ticket } = await import('./Ticket'));
    } catch (e) {
        // Typically missing userscript configuration.
        log(e);
        root.render(<Notice message={`${e.message} Showing the original page.`} />);
        return;
    }

    const queryClient = new QueryClient();
    root.render(
        <QueryClientProvider client={queryClient} contextSharing={false}>
            <Ticket />
        </QueryClientProvider>
    );
}

// Do the required initial work. Gets called every time the URL changes,
// so that elements can be re-inserted as a user navigates a page with
// different routes.
async function main() {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    await awaitElement('body');

    if (/^users\//.test(path)) {
        initUsers();
    }
    if (/^projects\/[^/]+\//.test(path)) {
        initProjects();
    }
    if (/^projects\/[^/]+\/tickets\/\d+/.test(path)) {
        initTickets();
        await renderTicket();
    }
}

// Call `main()` every time the page URL changes, including on the first load.
addLocationChangeCallback(() => {
    // Greasemonkey doesn't bubble errors up to the main console,
    // so we have to catch them manually and log them.
    main().catch((e) => {
        log(e);
    });
});
