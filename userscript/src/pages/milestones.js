import { log } from '../utils';

/**
 * Replace the milestone pie chart with a progress bar.
 *
 * The figures come from the ticket stats next to the chart, so the bar doesn't
 * depend on the chart itself.
 */
function progressBar() {
    const stats = document.querySelector('#milestone-view .ticket-stats .inside');
    if (!stats || stats.dataset.bar) {
        return;
    }
    const value = (kind) => parseInt(stats.querySelector(`dt.${kind} + dd`)?.textContent.replace(/\D/g, ''), 10);
    const open = value('open');
    const closed = value('closed');
    if (Number.isNaN(open) || Number.isNaN(closed)) {
        return;
    }
    stats.dataset.bar = 'true';

    const total = open + closed;
    const percent = total ? Math.round((closed / total) * 100) : 0;
    const bar = document.createElement('div');
    bar.className = 'TicketBar TicketBar--progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', String(percent));
    const done = document.createElement('span');
    done.className = 'TicketBar__closed';
    done.style.width = `${percent}%`;
    bar.append(done);
    const caption = document.createElement('p');
    caption.className = 'TicketBar__caption';
    caption.textContent = `${percent}% complete (${closed} of ${total} tickets closed)`;
    stats.append(bar, caption);
}

/**
 * Initialize milestone page improvements.
 */
export default function initMilestones() {
    log('Initializing milestone page');
    progressBar();
}
