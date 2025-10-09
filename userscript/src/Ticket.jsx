import React, { useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { createRoot } from 'react-dom/client';
import { log } from './utils';
import CopyButton from './CopyButton';
import { DecoratedTicketLinks, DecoratedAvatars, Avatar, api, dateFormat, dateTimeFormat } from './Global';
import { URLContext } from './URLContext';
import './styles/TicketSidebar.css';
import './styles/TicketSubject.css';

// Query client.
const queryClient = new QueryClient();

/**
 * Ticket element.
 *
 * @return {JSX.Element}
 */
export default function Ticket() {
    return (
        <QueryClientProvider client={queryClient} contextSharing={true}>
            <ActualTicket />
        </QueryClientProvider>
    );
}

/**
 * Actual ticket element.
 *
 * @return {JSX.Element}
 */
function ActualTicket() {
    const urlContext = useContext(URLContext);
    const id = 3434; // TODO: Change to use urlContext.id.
    const project_id = 'ki-profile'; // TODO: Change to use urlContext.project_id.
    const { data, status, error } = useQuery(['Context', id], async () => {
        return await api.getContext(project_id, id);
    }, { refetchOnMount: false, refetchOnWindowFocus: false});

    if (status === 'loading') return;

    return (
        <div>
            <Subject ticket={data.ticket} projectId={project_id} />
            <Sidebar data={data} />
            <DecoratedAvatars />
            <DecoratedTicketLinks />
        </div>
    );
}

/**
 * Subject element.
 *
 * @param {object} ticket
 * @param {string} projectId
 * @param {string} title
 *
 * @return {JSX.Element}
 */
function Subject({ticket, projectId }) {
    const target = document.querySelector('.Thread__header');
    let container = target.querySelector('div.TicketSubjectComponent');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('TicketSubjectComponent');
        target.prepend(container);
        const root = createRoot(container);
        root.render(renderSubject(ticket.id, projectId, ticket.subject));
    }

    function renderSubject(ticketId, projectId, title) {
        return (
            <div className="TicketSubject">
                <h2 id="ticket-subject"><span className="TicketId">#{ticketId}</span> {title}</h2>
                <CopyButton title="Copy ticket link" elementId="#ticket-subject"/>
                <div className="TicketId__actions">
                    <a className="btn" href={'/projects/' + projectId + '/tickets/new'}>New ticket</a>
                    <a className="btn" href={'/projects/' + projectId + '/tickets'}>Back to list</a>
                </div>
            </div>
        );
    }
}

/**
 * Sidebar element.
 *
 * @param {Object} data
 *
 * @return {JSX.Element}
 */
function Sidebar({ data }) {
    const target = document.querySelector('div#content div.right');
    let container = target.querySelector('div.TicketSidebarComponent');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('TicketSidebarComponent');
        target.prepend(container);
        const root = createRoot(container);
        root.render(renderSidebar(data));
    }

    // TODO: Get value for userUrl variable.
    // TODO: Get value for userName variable.

    function renderSidebar(data) {
        return (
            <div className="sidebar__module sidebar__module--medium">
                <div className="box box--sidebar">
                    <div className="island">
                        <div className="CodebaseComponent">
                            <Reporter userUrl="#" userName={data.ticket.reporter.username} dateTime={data.ticket.created} />
                            <Participants users={data.participants} />
                        </div>
                        <Milestone ticket={data.ticket} />
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <ReferencedTickets tickets={data.links} />
                                <Blockers />
                            </ul>
                        </div>
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <Tags tags={data.ticket.tags} />
                                <Branch url="#" name="master" />
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

/**
 * Reporter component.
 *
 * @return {JSX.Element}
 */
function Reporter({userUrl, userName, dateTime}) {
    const parsedDate = new Date(Date.parse(dateTime));

    // TODO: Add user avatar to component.

    return (
        <ul className="Properties Properties--row">
            <li className="Properties__item">
                <h3 className="Properties__title">Reported by</h3>
                <p className="Properties__value">
                    <a href={userUrl} className="text--link">{userName}</a> on {parsedDate.toLocaleString('sv-SE', dateTimeFormat)}
                </p>
            </li>
        </ul>
    );
}

/**
 * Participants component.
 *
 * @return {JSX.Element|null}
 */
function Participants({users}) {

    if (users.length === 0) {
        return null;
    }

    return (
        <ul className="Properties Properties--column">
            <li className="Properties__item">
                <h3 className="Properties__title">Participants</h3>
                <div className="Participant__list">
                { users.map((user) => {
                    return (
                        <Avatar user={user} size="large" key={user.id} />
                    );
                })}
                </div>
            </li>
        </ul>
    );
}

/**
 * Milestone component.
 *
 * @return {JSX.Element|null}
 */
function Milestone({ ticket }) {
    if (!ticket.hasOwnProperty('milestone')) {
        return null;
    }

    const urlContext = useContext(URLContext);
    const endDate = new Date(Date.parse(ticket.milestone.endDate));
    const passed = (() => Date.parse(ticket.milestone.endDate) < Date.now());
    const userUrl = '#', userName = 'John Doe';

    return (
        <div className="CodebaseComponent">
            <ul className="Properties Properties--row">
                <li className="Properties__item">
                    <h3 className="Properties__title icon icon-milestone">Milestone</h3>
                    <p className="Properties__value">
                        <span className="primary"><a href={`/projects/${urlContext.project_id}/milestone/` + ticket.milestone.guid}>{ticket.milestone.name}</a></span>
                    </p>
                </li>
                <li className="Properties__item">
                    <h3 className="Properties__title icon icon-calendar">Due</h3>
                    <p className="Properties__value"><span className={passed ? 'date--passed' : 'date--not-passed'}>{endDate.toLocaleDateString('sv-SE', dateFormat)}</span></p>
                </li>
                <li className="Properties__item">
                    <h3 className="Properties__title icon icon-user">PM</h3>
                    <p className="Properties__value">
                        <a href={userUrl} className="text--link">{userName}</a>
                    </p>
                </li>
            </ul>
        </div>
    );
}

/**
 * Referenced tickets component.
 *
 * @param {Array} tickets
 *
 * @return {JSX.Element|null}
 */
function ReferencedTickets({tickets}) {

    if (tickets.length === 0) {
        return null;
    }

    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Referenced tickets</h3>
            <ul className="Properties__value Properties__value--list ReferencedTickets">
            </ul>
        </li>
    )
}

/**
 * Blockers component.
 *
 * @todo Implement.
 *
 * @return {JSX.Element}
 */
function Blockers() {
    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Blockers</h3>
            <p className="Properties__value"><span className="empty">None</span></p>
        </li>
    );
}

/**
 * Tags component.
 *
 * @param {Array} tags
 *
 * @return {JSX.Element|null}
 */
function Tags({ tags }) {
    const items = [];
    if (tags) {
        tags.forEach(function (tag, index) {
            let classes = ['icon'];
            if (tag.match(/^branch:/g)) {
                return;
                // tag.replace(/^branch:/g, '');
                // classes.push('col-orange', 'icon-branch');
            } else if (tag.match(/^alert:/g)) {
                tag.replace(/^alert:/g, '');
                classes.push('col-red', 'icon-status_id');
            } else {
                classes.push('col-grey');
            }
            items.push({
                index: index,
                text: tag,
                class: classes.join(' '),
            });
        });
    }

    if (items.length === 0) {
        return null;
    }

    log(items);

    return (
        <li className="Properties__item">
            <h3 className="Properties__title icon icon-tags">Tags</h3>
            <p className="Properties__value Properties__value--tags">
                { items.map((tag) => {
                    return (
                        <span className={tag.class} key={tag.index}>{tag.text}</span>
                    );
                })}
            </p>
        </li>
    );
}

/**
 * Branch component.
 *
 * @return {JSX.Element}
 */
function Branch({url, name}) {
    return (
        <li className="Properties__item">
            <h3 className="Properties__title icon icon-branch">Branch</h3>
            <p className="Properties__value">
                <span id="ticket-branch" className="text--code"><a href={url}>{name}</a></span>
                <CopyButton title="Copy branch link" elementId="#ticket-branch" />
            </p>
            <p className="Properties__value hidden"><span className="empty">No branch configured</span></p>
        </li>
    );
}
