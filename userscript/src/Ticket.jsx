import React, { useContext, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { createRoot } from 'react-dom/client';
import { log } from './utils';
import CopyButton from './CopyButton';
import Loading from "./styles/Loading.svg?react";
import { DecoratedTicketLinks, DecoratedAvatars, Avatar, api, dateFormat, dateTimeFormat } from './Global';
import { TICKET_FORMAT } from "./CodebaseAPI.js";
import { URLContext } from './URLContext';
import './styles/Ticket.css';

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
 * @return {JSX.Element|null}
 */
function ActualTicket() {
    const urlContext = useContext(URLContext);
    const id = 3434; // TODO: Change to use urlContext.id.
    const projektPermalink = 'ki-profile'; // TODO: Change to use urlContext.project_id.
    const { isLoading, error, data } = useQuery(['Context', id], async () => {
        return await api.getContext(projektPermalink, id);
    }, { refetchOnMount: false, refetchOnWindowFocus: false});

    if (isLoading) return (
        <div className="CodebaseComponent CodebaseComponent--loading">
            <Loading />
        </div>
    );

    return (
        <div className="ReactComponentWrapper">
            <Subject ticket={data.ticket} projektPermalink={projektPermalink} />
            <Sidebar data={data} projektPermalink={projektPermalink} />
            <DecoratedAvatars assignments={data.assignments} />
            <DecoratedTicketLinks ticketIds={data.referencedTickets} projectPermalink={projektPermalink} />
        </div>
    );
}

/**
 * Subject element.
 *
 * @param {object} ticket
 * @param {string} projektPermalink
 *
 * @return {JSX.Element}
 */
function Subject({ticket, projektPermalink }) {
    const target = document.querySelector('.Thread__header');
    let container = target.querySelector('div.TicketSubjectComponent');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('TicketSubjectComponent');
        target.prepend(container);
        const root = createRoot(container);
        root.render(renderSubject(ticket.id, projektPermalink, ticket.subject));
    }

    function renderSubject(ticketId, projektPermalink, title) {
        return (
            <div className="TicketSubject">
                <h2 id="ticket-subject"><span className="TicketId">#{ticketId}</span> {title}</h2>
                <CopyButton title="Copy ticket link" elementId="#ticket-subject"/>
                <div className="TicketId__actions">
                    <a className="btn" href={'/projects/' + projektPermalink + '/tickets/new'}>New ticket</a>
                    <a className="btn" href={'/projects/' + projektPermalink + '/tickets'}>Back to list</a>
                </div>
            </div>
        );
    }
}

/**
 * Sidebar element.
 *
 * @param {Object} data
 * @param {string} projektPermalink
 *
 * @return {JSX.Element}
 */
function Sidebar({ data, projektPermalink }) {
    const reporterId = data.ticket.reporter.id;
    const reporter = data.assignments.find((assignment) => assignment.id === reporterId);

    const managerId = data.ticket.milestone.responsibleUserId;
    const manager = data.assignments.find((assignment) => assignment.id === managerId);

    let branch = null;
    if (data.ticket.hasOwnProperty('tags')) {
        branch = data.ticket.tags.filter((tag) => tag.startsWith('branch:')).map((tag) => tag.replace('branch:', ''))[0];
    }

    const target = document.querySelector('div#content div.right');
    let container = target.querySelector('div.TicketSidebarComponent');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('TicketSidebarComponent');
        target.prepend(container);
        const root = createRoot(container);
        root.render(renderSidebar(data, reporter, manager));
    }

    function renderSidebar(data, reporter, manager) {
        return (
            <div className="sidebar__module sidebar__module--medium">
                <div className="box box--sidebar">
                    <div className="island">
                        <Reporter user={reporter} dateTime={data.ticket.created} />
                        <Participants users={data.participants} />
                        <Milestone user={manager} ticket={data.ticket} />
                        <div className="CodebaseComponent">
                            <ReferencedTickets ticketIds={data.referencedTickets} projectPermalink={projektPermalink} />
                            <Blockers />
                        </div>
                        <Tags tags={data.ticket.tags} />
                        <Branch url="#" name={branch} />
                        <Watchers />
                    </div>
                </div>
            </div>
        );
    }
}

/**
 * Reporter component.
 *
 * @param {Object} user
 * @param {string} dateTime
 *
 * @return {JSX.Element}
 */
function Reporter({user, dateTime}) {
    const parsedDate = new Date(Date.parse(dateTime));

    return (
        <div className="CodebaseComponent">
            <ul className="Properties Properties--row">
                <li className="Properties__item">
                    <h3 className="Properties__title">Reported by</h3>
                    <p className="Properties__value">
                        <span className="text--bold"><a href="#" className="text--link">{user.fullName}</a></span> on {parsedDate.toLocaleString('sv-SE', dateTimeFormat)}
                    </p>
                </li>
            </ul>
        </div>
    );
}

/**
 * Participants component.
 *
 * @param {Array} users
 *
 * @return {JSX.Element|null}
 */
function Participants({users}) {
    if (users.length === 0) {
        return null;
    }

    return (
        <div className="CodebaseComponent">
            <ul className="Properties Properties--column">
                <li className="Properties__item">
                    <h3 className="Properties__title">Participants</h3>
                    <div className="Participant__list">
                    { users.map((user) => {
                        return (
                            <Avatar user={user} size="medium" key={user.id} />
                        );
                    })}
                    </div>
                </li>
            </ul>
        </div>
    );
}

/**
 * Milestone component.
 *
 * @param {Object} user
 * @param {Object} ticket
 *
 * @return {JSX.Element|null}
 */
function Milestone({ user, ticket }) {
    if (!ticket.hasOwnProperty('milestone')) {
        return null;
    }

    const urlContext = useContext(URLContext);
    const endDate = new Date(Date.parse(ticket.milestone.endDate));
    const passed = (() => Date.parse(ticket.milestone.endDate) < Date.now());
    const userUrl = '#'; // TODO: Fix this.

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
                        <a href={userUrl} className="text--link">{user.fullName}</a>
                    </p>
                </li>
            </ul>
        </div>
    );
}

/**
 * Referenced tickets component.
 *
 * @todo Implement.
 *
 * @param {Array} ticketIds
 * @param {string} projectPermalink
 *
 * @return {JSX.Element|null}
 */
function ReferencedTickets({ticketIds, projectPermalink}) {

    return null;

    if (ticketIds.length === 0) {
        return null;
    }

    const { isLoading, error, data } = useQuery(['MinimalTickets', ticketIds], async () => {
        return await api.getMultipleTickets(projectPermalink, ticketIds, TICKET_FORMAT.MIN);
    }, { refetchOnMount: false, refetchOnWindowFocus: false});

    if (isLoading) return (
        <div className="CodebaseComponent CodebaseComponent--loading">
            <Loading />
        </div>
    );

    return (
        <div className="CodebaseComponent">
            <ul className="Properties Properties--column">
                <li className="Properties__item">
                    <h3 className="Properties__title">Referenced tickets</h3>
                    <ul className="Properties__value Properties__value--list ReferencedTickets">
                        { data.map((ticket) => {
                            return (
                                <li key={ticket.id} dangerouslySetInnerHTML={{__html: ticket.htmlLink}} />
                            );
                        })}
                    </ul>
                </li>
            </ul>
        </div>
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

    useEffect(() => {
        const parent = document.querySelector('.relationships');
        const link = parent.querySelector('a');
        const target = document.querySelector('.Blockers');
        parent.removeChild(link);
        link.classList.remove('btn', 'btn--neutral');
        link.classList.add('AddBlockersLink', 'icon-only', 'icon-add');
        link.innerText = '';
        target.appendChild(link);
    })

    return (
        <div className="Blockers">
            <ul className="Properties Properties--column">
                <li className="Properties__item">
                    <h3 className="Properties__title">Blockers</h3>
                    <p className="Properties__value"><span className="empty">None</span></p>
                </li>
            </ul>
        </div>
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

    if (!name) {
        return null;
    }

    return (
        <div className="CodebaseComponent">
            <ul className="Properties Properties--row">
                <li className="Properties__item">
                    <h3 className="Properties__title icon icon-branch">Branch</h3>
                    <p className="Properties__value">
                        <span id="ticket-branch" className="text--code"><a href={url}>{name}</a></span>
                        <CopyButton title="Copy branch link" elementId="#ticket-branch" />
                    </p>
                    <p className="Properties__value hidden"><span className="empty">No branch configured</span></p>
                </li>
            </ul>
        </div>
    );
}

/**
 * Commits component.
 *
 * @todo Implement.
 *
 * @param {Array} commits
 *
 * @return {JSX.Element|null}
 */
function Commits({commits}) {

    if (commits.length === 0) {
        return null;
    }

    return (
        <ul className="Properties Properties--column">
            <li className="Properties__item">
                <h3 className="Properties__title">Commits</h3>
                <ul className="Properties__value Properties__value--list ReferencedTickets">
                </ul>
            </li>
        </ul>
    )
}

/**
 * Watchers component.
 *
 * @todo Implement.
 *
 * @return {JSX.Element}
 */
function Watchers() {
    return (
        <div className="CodebaseComponent">
            <ul className="Properties Properties--column">
                <li className="Properties__item">
                    <h3 className="Properties__title">Notifications</h3>
                    <p className="Properties__value">
                        <button className="btn btn--medium icon icon-unsubscribe">Unsubscribe</button>
                    </p>
                    <p className="help">You're receiving notifications because you're subscribed to this ticket.</p>
                </li>
                <li className="Properties__item">
                    <p className="Properties__value">
                        <button className="btn btn--medium icon icon-subscribe">Subscribe</button>
                    </p>
                    <p className="help">You're not receiving notifications from this ticket.</p>
                </li>
            </ul>
        </div>
    )
}