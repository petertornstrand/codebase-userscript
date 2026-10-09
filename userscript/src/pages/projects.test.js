import { beforeEach, describe, expect, it } from 'vitest';
import initProjects from './projects';
import { projectHeader } from '../test/fixtures';

beforeEach(() => {
    document.body.innerHTML = projectHeader;
    window.history.pushState({}, '', '/projects/acme/tickets');
});

describe('project search', () => {
    it('moves the search into a centered header container', () => {
        initProjects();
        const center = document.querySelector('.site-header__center');
        expect(center).not.toBeNull();
        expect(center.querySelector('.site-header__search')).not.toBeNull();
    });

    it('scopes the search to the current project', () => {
        initProjects();
        const hidden = document.querySelector('input[name="projects[]"]');
        expect(hidden.value).toBe('acme');
        expect(document.querySelector('#q').placeholder).toBe('Search Acme Website...');
    });

    it('hides the toolbar search button', () => {
        initProjects();
        const button = document.querySelector('a[data-tooltip="Search"]');
        expect(button.parentElement.classList.contains('userscript-hidden')).toBe(true);
    });

    it('is idempotent', () => {
        initProjects();
        initProjects();
        expect(document.querySelectorAll('input[name="projects[]"]')).toHaveLength(1);
        expect(document.querySelectorAll('.site-header__center')).toHaveLength(1);
    });

    it('does not throw when the header is missing', () => {
        document.body.innerHTML = '';
        expect(() => initProjects()).not.toThrow();
    });
});

describe('open ticket filter', () => {
    it('appends the open status query to the ticket list link', () => {
        initProjects();
        const link = document.querySelector('li.main-menu__item > a');
        expect(link.getAttribute('href')).toBe('/projects/acme/tickets?report=all&query=status:open');
    });
});

describe('project overview sidebar', () => {
    const overview = `
<div id="content"><div class="right">
  <div class="sidebar__module"><h4 class="sidebar__heading">Who's on this project?</h4><div class="box"><ul class="layout-list">
    <li class="block-item block-item--has-img"><a class="block-item__inner block-item__link" href="#">Ada Lovelace<img class="block-item__img"></a></li>
  </ul></div></div>
  <div class="sidebar__module"><h4 class="sidebar__heading">Project Settings</h4><ul class="layout-list settings-list">
    <li class="settings-list__item"><a class="settings-list__link settings-list__link--edit" href="#edit">Edit project settings</a></li>
  </ul></div>
  <div class="sidebar__module"><h4 class="sidebar__heading">Quick Stats</h4><ul class="layout-list settings-list">
    <li class="settings-list__item settings-list__link settings-list__link--disk"><b>173 MB</b> disk space used in files.</li>
    <li class="settings-list__item settings-list__link settings-list__link--users"><b>10 users</b> from 1 company are working on this project.</li>
    <li class="settings-list__item settings-list__link settings-list__link--activity">Last activity was <b>about 4 hours ago</b>.</li>
  </ul></div>
</div></div>`;

    beforeEach(() => {
        document.body.innerHTML = projectHeader + overview;
        initProjects();
    });

    it('shows the member names as tooltips on the avatars', () => {
        expect(document.querySelector('.ProjectMembers .block-item__link').title).toBe('Ada Lovelace');
    });

    it('puts the project settings links in a drop-button menu', () => {
        const menu = document.querySelector('.ActionsMenu__menu');
        expect(menu.hidden).toBe(true);
        expect(menu.querySelector('a[href="#edit"]')).not.toBeNull();
        document.querySelector('.ActionsMenu__button').click();
        expect(menu.hidden).toBe(false);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(menu.hidden).toBe(true);
    });

    it('remakes quick stats and moves them to the top of the sidebar', () => {
        const right = document.querySelector('#content .right');
        expect(right.firstElementChild.classList.contains('QuickStats')).toBe(true);
        const rows = [...right.querySelectorAll('.QuickStats__item')].map((i) => i.textContent);
        expect(rows).toEqual(['173 MBDisk space used', '10 usersfrom 1 company', 'about 4 hours agoLast activity']);
    });

    it('is idempotent', () => {
        initProjects();
        expect(document.querySelectorAll('.ActionsMenu').length).toBe(1);
        expect(document.querySelectorAll('.QuickStats__item').length).toBe(3);
    });
});

describe('project overview ticket bar', () => {
    beforeEach(() => {
        document.body.innerHTML = projectHeader + `
<div id="dashboard-overview"><div class="dashboard-overview__area"><div class="js-stat-blocks">
  <a class="StatBlock StatBlock--open"><div class="StatBlock__value"> 8 </div></a>
  <a class="StatBlock StatBlock--closed"><div class="StatBlock__value"> 328 </div></a>
</div></div></div>`;
    });

    it('shows the share of open tickets in a bar', () => {
        initProjects();
        const bar = document.querySelector('.TicketBar');
        expect(bar.getAttribute('aria-label')).toBe('8 open and 328 closed tickets, 2% open');
        expect(document.querySelector('.TicketBar__caption').textContent).toBe('336 tickets, 2% open');
    });

    it('is idempotent and leaves the page alone without counts', () => {
        initProjects();
        initProjects();
        expect(document.querySelectorAll('.TicketBar').length).toBe(1);
        document.body.innerHTML = projectHeader;
        initProjects();
        expect(document.querySelector('.TicketBar')).toBeNull();
    });
});

describe('project overview members with several companies', () => {
    const company = (name, users) => `
<div class="sidebar__module"><h4 class="sidebar__heading text--small">${name}</h4><div class="box"><ul class="layout-list">
  ${users.map((u) => `<li class="block-item block-item--has-img"><a class="block-item__inner block-item__link" href="#">${u}<img class="block-item__img"></a></li>`).join('')}
</ul></div></div>`;

    beforeEach(() => {
        document.body.innerHTML = projectHeader + `<div id="content"><div class="right">
  <div class="sidebar__module"><h4 class="sidebar__heading">Who's on this project?</h4></div>
  ${company('Acme', ['Ada Lovelace'])}
  ${company('Globex', ['Grace Hopper', 'Alan Turing'])}
</div></div>`;
        initProjects();
    });

    it('styles every company as members, with a tooltip on each avatar', () => {
        const modules = document.querySelectorAll('.ProjectMembers');
        expect(modules.length).toBe(3);
        const titles = [...document.querySelectorAll('.ProjectMembers .block-item__link')].map((a) => a.title);
        expect(titles).toEqual(['Ada Lovelace', 'Grace Hopper', 'Alan Turing']);
    });

    it('marks the title module that comes alone before the companies', () => {
        const title = document.querySelector('.ProjectMembers--title');
        expect(title.textContent).toContain("Who's on this project?");
        expect(document.querySelectorAll('.ProjectMembers--title').length).toBe(1);
    });

    it('is idempotent', () => {
        initProjects();
        expect(document.querySelectorAll('.ProjectMembers').length).toBe(3);
    });
});
