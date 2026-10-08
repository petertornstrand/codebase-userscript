import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ticketPage } from './test/fixtures';

// Simulate missing userscript config: loading the ticket module throws.
vi.mock('./utils', async (importOriginal) => ({
    ...(await importOriginal()),
    getCodebaseConfig: () => {
        throw new Error('Missing configuration value for key cbapi_key.');
    },
}));

describe('index', () => {
    beforeEach(() => {
        document.body.innerHTML = ticketPage;
        window.history.pushState({}, '', '/projects/acme/tickets/42');
    });

    it('shows a notice and keeps the page when the ticket module fails to load', async () => {
        await import('./index.jsx');
        await vi.waitFor(() => expect(document.querySelector('[role="alert"]')).not.toBeNull());
        expect(document.querySelector('[role="alert"]').textContent)
            .toContain('Missing configuration value for key cbapi_key.');
        expect(document.querySelector('.Thread__header')).not.toBeNull();
        // Non-React improvements still run.
        expect(document.querySelectorAll('.has-tasks')).toHaveLength(1);
    });
});
