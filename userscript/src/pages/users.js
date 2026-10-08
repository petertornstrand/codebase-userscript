import { log } from '../utils';

/**
 * Get the tickets worked on today, without duplicates.
 *
 * @return {{id: string, clientId: string, client: string, subject: string}[]}
 */
function getTickets() {
    const updates = document.querySelectorAll('ul.events:first-of-type li.ticket_update');
    const tickets = [];

    updates.forEach((elem) => {
        const projectLink = elem.querySelector('p.event span.project a');
        const idElem = elem.querySelector('p.event b.id');
        const subjectElem = elem.querySelector('p.event > a');
        if (!projectLink || !idElem || !subjectElem) {
            return;
        }
        const href = projectLink.getAttribute('href');
        const ticket = {
            id: idElem.innerText.trim().substring(1),
            clientId: href.substring(href.lastIndexOf('/') + 1),
            client: projectLink.innerText.trim(),
            subject: subjectElem.innerText.trim(),
        };
        if (!tickets.some((t) => t.id === ticket.id)) {
            tickets.push(ticket);
        }
    });

    return tickets;
}

/**
 * Add a list of tickets grouped by client to the top of the activity feed.
 *
 * @param {ReturnType<typeof getTickets>} tickets
 */
function listTicketsPerClient(tickets) {
    const wrapper = document.querySelector('div.activity');
    if (!wrapper || wrapper.querySelector('.UserTickets')) {
        return;
    }

    const clients = [...new Set(tickets.map((item) => item.clientId))];
    clients.forEach((clientId) => {
        const results = tickets.filter((ticket) => ticket.clientId === clientId);

        const h2 = document.createElement('h2');
        h2.textContent = results[0].client;

        const ul = document.createElement('ul');
        ul.classList.add('events');
        results.forEach((ticket) => {
            const li = document.createElement('li');
            li.textContent = `#${ticket.id} ${ticket.subject}`;
            ul.appendChild(li);
        });

        const container = document.createElement('div');
        container.classList.add('feed', 'UserTickets');
        container.append(h2, ul);
        wrapper.prepend(container);
    });
}

/**
 * Initialize user page improvements.
 */
export default function initUsers() {
    log('Initializing user page');
    listTicketsPerClient(getTickets());
}
