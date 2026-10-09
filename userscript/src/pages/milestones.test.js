import { beforeEach, describe, expect, it } from 'vitest';
import initMilestones from './milestones';

const page = (open, closed) => `
<div id="milestone-view"><div class="ticket-stats"><div class="inside"><dl>
  <dt class="open">Open Tickets</dt><dd><a href="#">${open}</a></dd>
  <dt class="closed">Closed Tickets</dt><dd><a href="#">${closed}</a></dd>
</dl></div></div></div>`;

beforeEach(() => {
    document.body.innerHTML = page(15, 5);
});

describe('milestone progress bar', () => {
    it('shows how many of the tickets are closed', () => {
        initMilestones();
        const bar = document.querySelector('.TicketBar--progress');
        expect(bar.getAttribute('aria-valuenow')).toBe('25');
        expect(bar.firstElementChild.style.width).toBe('25%');
        expect(document.querySelector('.TicketBar__caption').textContent).toBe('25% complete (5 of 20 tickets closed)');
    });

    it('handles a milestone without tickets', () => {
        document.body.innerHTML = page(0, 0);
        initMilestones();
        expect(document.querySelector('.TicketBar--progress').getAttribute('aria-valuenow')).toBe('0');
    });

    it('is idempotent and leaves other pages alone', () => {
        initMilestones();
        initMilestones();
        expect(document.querySelectorAll('.TicketBar').length).toBe(1);
        document.body.innerHTML = '';
        initMilestones();
        expect(document.querySelector('.TicketBar')).toBeNull();
    });
});
