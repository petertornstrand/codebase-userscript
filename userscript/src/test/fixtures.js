/**
 * Minimal HTML fixtures that mimic the parts of the Codebase DOM the
 * userscript touches. Update these when Codebase markup changes.
 */

export const projectHeader = `
<header class="site-header">
  <div class="container">
    <div class="site-header__left">
      <a class="site-header__title" title="Acme Website" href="/projects/acme">Acme Website</a>
    </div>
    <div class="site-header__search">
      <form action="/search"><input id="q" name="q" placeholder="Search"></form>
    </div>
    <div class="site-header__right">
      <ul><li><a data-tooltip="Search" href="/search">Search</a></li></ul>
    </div>
  </div>
</header>
<ul><li class="main-menu__item"><a href="/projects/acme/tickets?report=all">Tickets</a></li></ul>`;

const update = (id, project, projectId, subject) => `
<li class="ticket_update">
  <p class="event">
    <b class="id">#${id}</b>
    <span class="project"><a href="/projects/${projectId}">${project}</a></span>
    <a href="/projects/${projectId}/tickets/${id}">${subject}</a>
  </p>
</li>`;

export const userActivity = `
<div class="activity">
  <ul class="events">
    ${update(1, 'Acme', 'acme', 'Fix login')}
    ${update(2, 'Globex', 'globex', 'New landing page')}
    ${update(1, 'Acme', 'acme', 'Fix login')}
    ${update(3, 'Acme', 'acme', 'Update footer')}
  </ul>
</div>`;

export const ticketPage = `
<div id="sub-header"></div>
<div id="content">
  <div class="Thread__header">
    <div class="js-ticket-properties"><ul class="TicketProperties">
      <li class="TicketProperties__column"><h3 class="TicketProperties__title">Type</h3><p class="TicketProperties__value">Bug</p></li>
    </ul></div>
  </div>
  <div class="Thread__timeline">
    <div class="Post Post--full" id="post-1"><ul><li>plain</li></ul></div>
    <div class="Post Post--full" id="post-2"><ul><li class="todo">do it</li></ul></div>
    <div class="Post Post--full" id="post-3">last</div>
  </div>
  <div class="relationships"><a class="btn btn--neutral" rel="new-blocking" href="#">Add blocker</a></div>
  <div class="right">
    <div class="sidebar__module sidebar__module--medium"><div class="box box--positive"><div class="island">
      <div class="sidebar__content text--positive">This ticket can be viewed by anyone who has access to this project.</div>
    </div></div></div>
    <div class="sidebar__module"><div class="box"><ul class="layout-list">
      <li class="block-item"><a class="block-item__inner block-item__link" href="#criteria">Add acceptance criteria</a></li>
      <li class="block-item"><a class="block-item__inner block-item__link" data-method="delete" href="#delete">Delete this ticket</a></li>
    </ul></div></div>
  </div>
</div>`;

export const ticketContext = {
    ticket: {
        id: 42,
        subject: 'Fix the thing',
        created: '2025-01-02T10:00:00Z',
        reporter: { id: 1 },
        milestone: { name: 'M1', guid: 'abc', endDate: '2030-01-01', responsibleUserId: 1 },
        tags: ['branch:42-fix-the-thing', 'alert:urgent', 'misc'],
    },
    assignments: [{ id: 1, fullName: 'Ada Lovelace' }],
    participants: [{ id: 1, fullName: 'Ada Lovelace' }, { id: 2, fullName: 'Grace Hopper' }],
    referencedTickets: [],
};
