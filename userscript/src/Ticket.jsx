import React, { useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { createRoot } from 'react-dom/client';
import { log } from './utils';
import CopyButton from './CopyButton';
import { DecoratedTicketLinks, DecoratedAvatars, Avatar, dateFormat, dateTimeFormat } from './Global';
import { CodebaseContext } from './CodebaseContext';
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

function ActualTicket() {
    const context = useContext(CodebaseContext);
    const urlContext = useContext(URLContext);
    const id = 3434; // TODO: Change to use urlContext.id.
    const project_id = 'ki-profile'; // TODO: Change to use urlContext.project_id.
    const { data, status, error } = useQuery(['Context', id], async () => {
        return await context.api.getContext(project_id, id);
    }, { refetchOnMount: false, refetchOnWindowFocus: false});

    if (status === 'loading') return;

    return (
        <div>
            <Subject ticketId={data.ticket.id} projectId={urlContext.project_id} title={data.ticket.subject} />
            <Sidebar data={data} />
            <DecoratedAvatars />
            <DecoratedTicketLinks />
        </div>
    );
}

/**
 * Subject element.
 *
 * @param {int} ticketId
 * @param {string} projectId
 * @param {string} title
 *
 * @return {JSX.Element}
 */
function Subject({ticketId, projectId, title}) {
    const target = document.querySelector('.Thread__header');
    let container = target.querySelector('div.TicketSubjectComponent');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('TicketSubjectComponent');
        target.prepend(container);
        const root = createRoot(container);
        root.render(renderSubject(ticketId, projectId, title));
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
                            <ul className="Properties Properties--column">
                                <Reporter userUrl="#" userName={data.ticket.username} dateTime={data.ticket.created} />
                                <Participants users={data.participants} />
                            </ul>
                        </div>
                        <div className="CodebaseComponent">
                            <Milestone milestone={data.ticket.milestone} userUrl="#" userName={data.ticket.milestone.responsibleUserId} />
                        </div>
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
    const user = document.querySelector(".ThreadMeta ul.layout-list .ThreadMeta__item.icon-user span.text--bold").innerHTML;
    const parsedDate = new Date(Date.parse(dateTime));

    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Reported by</h3>
            <p className="Properties__value">
                <a href={userUrl} className="text--link">{userName}</a> on {parsedDate.toLocaleString('sv-SE', dateTimeFormat)}
            </p>
        </li>
    );
}

/**
 * Participants component.
 *
 * @return {JSX.Element}
 */
function Participants({users}) {

    if (users.length === 0) {
        return null;
    }

    return (
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
    );
}

/**
 * Milestone component.
 *
 * @return {JSX.Element}
 */
function Milestone({milestone, userUrl, userName}) {
    const urlContext = useContext(URLContext);
    const endDate = new Date(Date.parse(milestone.endDate));
    const passed = (() => Date.parse(milestone.endDate) < Date.now());

    //<p className="Properties__value hidden"><span className="empty">No milestone</span></p>

    return (
        <ul className="Properties Properties--row">
            <li className="Properties__item">
                <h3 className="Properties__title icon icon-milestone">Milestone</h3>
                <p className="Properties__value">
                    <span className="primary"><a href={`/projects/${urlContext.project_id}/milestone/` + milestone.guid}>{milestone.name}</a></span>
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
    );
}

/**
 * Referenced tickets component.
 *
 * @todo Implement.
 *
 * @return {JSX.Element}
 */
function ReferencedTickets({links}) {

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
 * @return {JSX.Element}
 */
function Tags({ tags }) {
    const items = [];
    tags.forEach(function (tag, index) {
        let classes = ['icon'];
        if (tag.match(/^branch:/g)) {
            return;
            // tag.replace(/^branch:/g, '');
            // classes.push('col-orange', 'icon-branch');
        }
        else if (tag.match(/^alert:/g)) {
            tag.replace(/^alert:/g, '');
            classes.push('col-red', 'icon-status_id');
        }
        else {
            classes.push('col-grey');
        }
        items.push({
            index: index,
            text: tag,
            class: classes.join(' '),
        });
    });

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
