import { log } from '../utils';

/**
 * Read the events in the activity feed.
 *
 * @return {{type: string, project: ?{name: string, url: string}, ticket: ?string, commits: number, author: ?string, avatar: ?HTMLImageElement}[]}
 */
export function readFeed() {
    return [...document.querySelectorAll('#feed li.event')].map((item) => {
        const line = item.querySelector('p.event');
        const projectLink = line?.querySelector('.project a');
        return {
            type: [...item.classList].find((name) => name !== 'event' && !/^(u-clearfix|area-|o$|e$|last-visible)/.test(name)) ?? 'other',
            project: projectLink ? { name: projectLink.textContent.trim(), url: projectLink.href } : null,
            ticket: line?.querySelector('b.id')?.textContent.trim() ?? null,
            commits: Number(line?.textContent.match(/(\d+) commit/)?.[1] ?? 0),
            author: line?.querySelector('.author a')?.textContent.trim() ?? null,
            avatar: item.querySelector('.gravatar img, .gravatar .InitialsAvatar'),
        };
    });
}

/**
 * Count how often each value occurs, most frequent first.
 *
 * @param {Array} items
 * @param {function} key - Returns a string to count, or nothing to skip the item.
 * @return {[string, {count: number, item: *}][]}
 */
function tally(items, key) {
    const counts = new Map();
    items.forEach((item) => {
        const value = key(item);
        if (!value) return;
        const entry = counts.get(value) ?? { count: 0, item };
        entry.count += 1;
        counts.set(value, entry);
    });
    return [...counts.entries()].sort((a, b) => b[1].count - a[1].count);
}

const element = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
};

/**
 * Add a summary of the loaded feed at the top of the sidebar: how much has
 * happened, where and by whom.
 */
function activitySummary() {
    const sidebar = document.querySelector('#content .right');
    if (!sidebar || sidebar.querySelector('.DashboardSummary')) {
        return;
    }
    const events = readFeed();
    if (!events.length) {
        return;
    }

    const tickets = new Set(events.filter((e) => e.ticket).map((e) => `${e.project?.name}${e.ticket}`)).size;
    const commits = events.reduce((sum, e) => sum + e.commits, 0);
    const projects = tally(events, (e) => e.project?.name).slice(0, 5);
    const people = tally(events, (e) => e.author).slice(0, 5);

    const module = element('div', 'sidebar__module DashboardSummary');
    module.append(element('h4', 'sidebar__heading heading--zeta', 'Recent activity'));

    const tiles = element('div', 'DashboardSummary__tiles');
    [[events.length, 'events'], [tickets, 'tickets'], [commits, 'commits']].forEach(([value, label]) => {
        const tile = element('div', 'DashboardSummary__tile');
        tile.append(element('strong', '', String(value)), element('span', '', label));
        tiles.append(tile);
    });
    module.append(tiles);

    if (projects.length) {
        module.append(element('h5', 'DashboardSummary__subheading', 'Busiest projects'));
        const list = element('ul', 'DashboardSummary__list');
        const max = projects[0][1].count;
        projects.forEach(([name, { count, item }]) => {
            const row = element('li', 'DashboardSummary__row');
            row.style.setProperty('--share', `${Math.round((count / max) * 100)}%`);
            const link = element('a', '', name);
            link.href = item.project.url;
            row.append(link, element('span', '', String(count)));
            list.append(row);
        });
        module.append(list);
    }

    if (people.length) {
        module.append(element('h5', 'DashboardSummary__subheading', 'Most active'));
        const row = element('div', 'DashboardSummary__people');
        people.forEach(([name, { count, item }]) => {
            const person = element('span', 'DashboardSummary__person');
            person.title = `${name}: ${count} ${count === 1 ? 'event' : 'events'}`;
            if (item.avatar) {
                const copy = item.avatar.cloneNode(true);
                copy.removeAttribute('width');
                copy.removeAttribute('height');
                // The copy is checked on its own, so that a placeholder gets replaced by initials too (avatars.js).
                delete copy.dataset.avatarChecked;
                copy.dataset.name = name;
                copy.alt = name;
                person.append(copy);
            } else {
                person.textContent = name[0];
            }
            row.append(person);
        });
        module.append(row);
    }

    module.append(element('p', 'DashboardSummary__note', `Based on the ${events.length} latest events.`));
    sidebar.prepend(module);
}

/**
 * Initialize dashboard improvements.
 */
export default function initDashboard() {
    log('Initializing dashboard');
    activitySummary();
}
