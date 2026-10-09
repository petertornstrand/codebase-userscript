import { beforeEach, describe, expect, it } from 'vitest';
import initDashboard, { readFeed } from './dashboard';

const event = (type, author, project, extra = '') => `
<li class="event ${type} u-clearfix area-x o">
  <div class="gravatar"><img class="gravatar" width="22" height="22" src="a.png"></div>
  <p class="event">
    <span class="author"><a href="/users/1">${author}</a></span>
    ${extra}
    <span class="project">— <a href="/projects/${project.toLowerCase()}">${project}</a></span>
  </p>
</li>`;

const feed = `
<div id="content"><div class="left"><div class="feed" id="feed"><h2>9 October 2026</h2><ul class="events">
  ${event('ticket_update', 'Ada L', 'Acme', '<span class="verb">updated</span> <b class="id">#1</b>')}
  ${event('ticket_update', 'Ada L', 'Acme', '<span class="verb">updated</span> <b class="id">#1</b>')}
  ${event('ticket_creation', 'Grace H', 'Acme', '<span class="verb">created</span> <b class="id">#2</b>')}
  ${event('push', 'Grace H', 'Globex', '<span class="verb">pushed</span> <a href="#">3 commit(s)</a>')}
  ${event('push', 'Alan T', 'Globex', '<span class="verb">pushed</span> <a href="#">2 commit(s)</a>')}
</ul></div></div><div class="right"><div class="sidebar__module">Your Projects</div></div></div>`;

beforeEach(() => {
    document.body.innerHTML = feed;
});

describe('readFeed', () => {
    it('reads type, project, ticket, commits and author of every event', () => {
        const events = readFeed();
        expect(events.map((e) => e.type)).toEqual(['ticket_update', 'ticket_update', 'ticket_creation', 'push', 'push']);
        expect(events[0]).toMatchObject({ author: 'Ada L', ticket: '#1', project: { name: 'Acme' } });
        expect(events[3].commits).toBe(3);
    });
});

describe('dashboard activity summary', () => {
    const tiles = () => [...document.querySelectorAll('.DashboardSummary__tile')].map((t) => t.textContent);

    it('is the first module in the sidebar', () => {
        initDashboard();
        expect(document.querySelector('#content .right').firstElementChild.classList.contains('DashboardSummary')).toBe(true);
    });

    it('counts events, distinct tickets and commits', () => {
        initDashboard();
        expect(tiles()).toEqual(['5events', '2tickets', '5commits']);
    });

    it('lists the busiest projects and the most active people', () => {
        initDashboard();
        const rows = [...document.querySelectorAll('.DashboardSummary__row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim());
        expect(rows).toEqual(['Acme3', 'Globex2']);
        expect(document.querySelector('.DashboardSummary__row a').getAttribute('href')).toContain('/projects/acme');
        expect(document.querySelector('.DashboardSummary__person').title).toBe('Ada L: 2 events');
    });

    it('is idempotent and does nothing without a feed', () => {
        initDashboard();
        initDashboard();
        expect(document.querySelectorAll('.DashboardSummary').length).toBe(1);
        document.body.innerHTML = '<div id="content"><div class="right"></div></div>';
        initDashboard();
        expect(document.querySelector('.DashboardSummary')).toBeNull();
    });

    it('copies avatars so that they are checked on their own', () => {
        document.querySelector('#feed img').dataset.avatarChecked = 'true';
        initDashboard();
        const copy = document.querySelector('.DashboardSummary__person img');
        expect(copy.dataset.avatarChecked).toBeUndefined();
        expect(copy.dataset.name).toBe('Ada L');
    });

    it('copies an avatar that has already been replaced by initials', () => {
        document.querySelector('#feed img').replaceWith(Object.assign(document.createElement('span'), { className: 'InitialsAvatar', textContent: 'AL' }));
        initDashboard();
        expect(document.querySelector('.DashboardSummary__person .InitialsAvatar').textContent).toBe('AL');
    });
});
