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
    stats.append(...progressParts(percent, `${percent}% complete (${closed} of ${total} tickets closed)`));
}

/**
 * Replace the pie chart of every milestone in the milestone list with a
 * progress bar and the share of closed tickets.
 */
function milestoneList() {
    document.querySelectorAll('#milestones li.ms').forEach((milestone) => {
        if (milestone.dataset.bar) {
            return;
        }
        const count = (kind) => parseInt(milestone.querySelector(`.tickets li.${kind} b`)?.textContent.replace(/\D/g, ''), 10);
        const open = count('open');
        const closed = count('closed');
        if (Number.isNaN(open) || Number.isNaN(closed)) {
            return;
        }
        milestone.dataset.bar = 'true';

        const total = open + closed;
        const percent = total ? Math.round((closed / total) * 100) : 0;
        const wrapper = document.createElement('div');
        wrapper.className = 'MilestoneProgress';
        wrapper.append(...progressParts(percent, `${percent}% complete`));
        milestone.append(wrapper);
    });
}

/**
 * Build a progress bar and its caption.
 *
 * @param {number} percent
 * @param {string} caption
 * @return {HTMLElement[]}
 */
function progressParts(percent, caption) {
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
    const text = document.createElement('p');
    text.className = 'TicketBar__caption';
    text.textContent = caption;
    return [bar, text];
}

/**
 * Initialize milestone page improvements.
 */
export default function initMilestones() {
    log('Initializing milestone page');
    progressBar();
    milestoneList();
}
