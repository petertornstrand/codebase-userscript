import { log } from '../utils';

/**
 * Add a project scoped full-text search to the header.
 *
 * Moves the global search form into the center of the header and adds a hidden
 * project input so the search is limited to the current project.
 */
function projectSearch() {
    const projectName = document.querySelector('.site-header__title');
    const headerLeft = document.querySelector('.site-header__left');
    const search = document.querySelector('.site-header__search');
    const input = document.querySelector('#q');
    const form = search?.querySelector('form');
    if (!projectName || !headerLeft || !form || !input || search.dataset.projectScoped) {
        return;
    }
    search.dataset.projectScoped = 'true';

    // Move the search form to its own container.
    const headerCenter = document.createElement('div');
    headerCenter.classList.add('site-header__center');
    headerLeft.after(headerCenter);
    headerCenter.append(search);

    input.setAttribute('placeholder', `Search ${projectName.getAttribute('title')}...`);

    // Limit the search to the current project.
    const projectInput = document.createElement('input');
    projectInput.type = 'hidden';
    projectInput.name = 'projects[]';
    projectInput.value = new URL(document.URL).pathname.split('/')[2];
    form.append(projectInput);

    // The header toolbar search button is redundant now.
    const searchButton = document.querySelector('a[data-tooltip="Search"]');
    searchButton?.parentElement.classList.add('userscript-hidden');
}

/**
 * Only display open tickets by default in the ticket list.
 */
function addOpenFilterToTickets() {
    const link = document.querySelector('li.main-menu__item > a[href$="/tickets?report=all"]');
    if (link) {
        link.setAttribute('href', link.getAttribute('href') + '&query=status:open');
    }
}

/**
 * Show the project members as a row of avatars, like the ticket participants.
 * The names move to the avatar tooltips.
 */
function projectMembers() {
    const list = document.querySelector('#content .right .block-item--has-img')?.closest('ul');
    const module = list?.closest('.sidebar__module');
    if (!module || module.dataset.members) {
        return;
    }
    module.dataset.members = 'true';
    module.classList.add('ProjectMembers');
    list.querySelectorAll('.block-item__link').forEach((link) => {
        const name = link.firstChild?.textContent.trim();
        if (name) {
            link.title = name;
            link.setAttribute('aria-label', name);
        }
    });
}

/**
 * Turn the "Project Settings" links into a drop-button.
 */
function projectSettingsMenu() {
    const list = document.querySelector('#content .right .settings-list__link--edit')?.closest('ul');
    const module = list?.closest('.sidebar__module');
    if (!module || module.dataset.menu) {
        return;
    }
    module.dataset.menu = 'true';

    const root = document.createElement('div');
    root.className = 'ActionsMenu';
    const button = document.createElement('button');
    button.className = 'btn ActionsMenu__button';
    button.type = 'button';
    button.textContent = 'Project settings';
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');
    const menu = document.createElement('div');
    menu.className = 'ActionsMenu__menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    menu.append(list);
    root.append(button, menu);
    module.replaceChildren(root);

    const setOpen = (open) => {
        menu.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
    };
    button.addEventListener('click', () => setOpen(menu.hidden));
    document.addEventListener('mousedown', (event) => !root.contains(event.target) && setOpen(false));
    document.addEventListener('keydown', (event) => event.key === 'Escape' && setOpen(false));
}

/**
 * Remake "Quick Stats" as a compact card at the top of the right sidebar,
 * one row per figure: an icon, the figure and what it is.
 */
function quickStats() {
    const list = document.querySelector('#content .right .settings-list__link--disk')?.closest('ul');
    const module = list?.closest('.sidebar__module');
    if (!module || module.dataset.stats) {
        return;
    }
    module.dataset.stats = 'true';

    const rows = {
        disk: { label: () => 'Disk space used' },
        users: { label: (text) => text.match(/from (.+?) (?:are|is) working/)?.[0].replace(/ (are|is) working/, '') },
        activity: { label: () => 'Last activity' },
    };
    const items = [...list.children].map((item) => {
        const key = Object.keys(rows).find((k) => item.classList.contains(`settings-list__link--${k}`));
        const value = item.querySelector('b')?.textContent.trim();
        const label = key && value ? rows[key].label(item.textContent.replace(/\s+/g, ' ').trim()) : null;
        return { item, key, value, label };
    });

    // Only rebuild the rows that could be read, keep the original text otherwise.
    items.forEach(({ item, key, value, label }) => {
        if (!label) {
            return;
        }
        item.className = 'QuickStats__item';
        item.innerHTML = '';
        const icon = document.createElement('span');
        icon.className = `QuickStats__icon icon icon-${key}`;
        const text = document.createElement('span');
        text.className = 'QuickStats__text';
        const strong = document.createElement('strong');
        strong.textContent = value;
        const small = document.createElement('span');
        small.textContent = label;
        text.append(strong, small);
        item.append(icon, text);
    });

    module.classList.add('QuickStats');
    module.parentElement.prepend(module);
}

/**
 * Replace the ticket pie chart with a bar showing the share of open tickets.
 * The counts come from the stat blocks, so it doesn't depend on the chart.
 */
function ticketBar() {
    const blocks = document.querySelector('#dashboard-overview .js-stat-blocks');
    if (!blocks || blocks.dataset.bar) {
        return;
    }
    const count = (kind) => parseInt(blocks.querySelector(`.StatBlock--${kind} .StatBlock__value`)?.textContent.replace(/\D/g, ''), 10);
    const open = count('open');
    const closed = count('closed');
    if (Number.isNaN(open) || Number.isNaN(closed)) {
        return;
    }
    blocks.dataset.bar = 'true';

    const total = open + closed;
    const percentOpen = total ? Math.round((open / total) * 100) : 0;
    const bar = document.createElement('div');
    bar.className = 'TicketBar';
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `${open} open and ${closed} closed tickets, ${percentOpen}% open`);
    const openPart = document.createElement('span');
    openPart.className = 'TicketBar__open';
    openPart.style.flexGrow = open;
    const closedPart = document.createElement('span');
    closedPart.className = 'TicketBar__closed';
    closedPart.style.flexGrow = closed;
    bar.append(openPart, closedPart);

    const caption = document.createElement('p');
    caption.className = 'TicketBar__caption';
    caption.textContent = `${total} tickets, ${percentOpen}% open`;
    blocks.after(bar, caption);
    blocks.closest('.dashboard-overview__area')?.classList.add('has-ticket-bar');
}

/**
 * Initialize project page improvements.
 */
export default function initProjects() {
    log('Initializing project page');
    projectSearch();
    addOpenFilterToTickets();
    projectMembers();
    projectSettingsMenu();
    quickStats();
    ticketBar();
}
