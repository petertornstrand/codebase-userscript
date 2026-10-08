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
 * Initialize project page improvements.
 */
export default function initProjects() {
    log('Initializing project page');
    projectSearch();
    addOpenFilterToTickets();
}
