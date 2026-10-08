import React, { useContext, useEffect } from 'react';
import { useQuery } from 'react-query';
import { createRoot } from 'react-dom/client';
import { log } from './utils';
import CopyButton from './CopyButton';
import Notice from './Notice';
import Loading from "./styles/Loading.svg?react";
import { DecoratedTicketLinks, DecoratedAvatars, Avatar, api, dateFormat, dateTimeFormat } from './Global';
import { URLContext } from './URLContext';
import './styles/Ticket.css';

/**
 * Ticket element.
 *
 * @return {JSX.Element|null}
 */
export default function Ticket() {
    const urlContext = useContext(URLContext);
    const id = parseInt(urlContext.id);
    const { isLoading, error, data } = useQuery(['Context', id], async () => {
        return await api.getContext(urlContext.project_id, id);
    }, { refetchOnMount: false, refetchOnWindowFocus: false});

    if (isLoading) return (
        <div className="CodebaseComponent CodebaseComponent--loading">
            <Loading />
        </div>
    );

    // Leave the original Codebase page untouched if the data is unavailable.
    if (error || !data?.ticket) {
        log('Unable to load ticket context', error);
        return <Notice message="could not load ticket data. Showing the original page." />;
    }

    return (
        <div className="ReactComponentWrapper">
            <Subject ticket={data.ticket} projektPermalink={urlContext.project_id} />
            <Sidebar data={data} projektPermalink={urlContext.project_id} />
            <DecoratedAvatars assignments={data.assignments} />
            <DecoratedTicketLinks tickets={data.referencedTickets} />
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
    useEffect(() => {
        const target = document.querySelector('.Thread__header');
        const parent = target.parentElement;
        const container = document.createElement('div');
        container.classList.add('TicketSubjectComponent');
        parent.replaceChild(container, target);
        target.remove();
        const root = createRoot(container);
        root.render(
            <div className="TicketSubject">
                <h2 id="ticket-subject"><span className="TicketId">#{ticket.id}</span> {ticket.subject}</h2>
                <CopyButton title="Copy ticket reference" elementId="#ticket-subject"/>
                <CopyButton title="Copy ticket link" icon="icon-copy-link" text={`[#${ticket.id} ${ticket.subject}](${window.location.href})`}/>
                <div className="TicketId__actions">
                    <JumpToLastComment />
                    <a className="btn" href={'/projects/' + projektPermalink + '/tickets/new'}>New ticket</a>
                    <a className="btn" href={'/projects/' + projektPermalink + '/tickets'}>Back to list</a>
                </div>
            </div>
        );
    }, []);
}

/**
 * Button that scrolls the last comment into view.
 *
 * @return {JSX.Element}
 */
function JumpToLastComment() {
    const handleClick = () => {
        const comments = document.querySelectorAll('.Post.Post--full');
        comments[comments.length - 1]?.scrollIntoView();
    };

    return (
        <button className="btn" onClick={handleClick}>Last comment</button>
    );
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
    const reporterId = data.ticket.reporter?.id;
    const reporter = data.assignments.find((assignment) => assignment.id === reporterId);

    const managerId = data.ticket.milestone?.responsibleUserId;
    const manager = data.assignments.find((assignment) => assignment.id === managerId);

    let branch = null;
    if (data.ticket.hasOwnProperty('tags')) {
        branch = data.ticket.tags.filter((tag) => tag.startsWith('branch:')).map((tag) => tag.replace('branch:', ''))[0];
    }

    useEffect(() => {
        const target = document.querySelector('div#content div.right');
        const container = document.createElement('div');
        container.classList.add('TicketSidebarComponent');
        target.prepend(container);
        const root = createRoot(container);
        root.render(renderSidebar(data, reporter, manager));
    }, []);

    function renderSidebar(data, reporter, manager) {
        return (
            <div className="sidebar__module sidebar__module--medium">
                <div className="box box--sidebar">
                    <div className="island">
                        {reporter && <Reporter user={reporter} dateTime={data.ticket.created} />}
                        <Participants users={data.participants} />
                        <Milestone user={manager} ticket={data.ticket} />
                        <div className="CodebaseComponent">
                            <ReferencedTickets tickets={data.referencedTickets} />
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
            <div className="Properties Properties--row">
                <div className="Properties__item">
                    <h3 className="Properties__title">Reported by</h3>
                    <p className="Properties__value">
                        <span className="text--bold"><a href="#" className="text--link">{user.fullName}</a></span> on {parsedDate.toLocaleString('sv-SE', dateTimeFormat)}
                    </p>
                </div>
            </div>
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
            <div className="Properties Properties--column">
                <div className="Properties__item">
                    <h3 className="Properties__title">Participants</h3>
                    <div className="Participant__list">
                    { users.map((user) => {
                        return (
                            <Avatar user={user} size="medium" key={user.id} />
                        );
                    })}
                    </div>
                </div>
            </div>
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
    const urlContext = useContext(URLContext);

    if (!ticket.milestone) {
        return null;
    }

    const endDate = new Date(Date.parse(ticket.milestone.endDate));
    const passed = (() => Date.parse(ticket.milestone.endDate) < Date.now());
    const userUrl = '#'; // TODO: Fix this.

    return (
        <div className="CodebaseComponent">
            <div className="Properties Properties--row">
                <div className="Properties__item">
                    <h3 className="Properties__title icon icon-milestone">Milestone</h3>
                    <p className="Properties__value">
                        <span className="primary"><a href={`/projects/${urlContext.project_id}/milestones/` + ticket.milestone.guid}>{ticket.milestone.name}</a></span>
                    </p>
                </div>
                <div className="Properties__item">
                    <h3 className="Properties__title icon icon-calendar">Due</h3>
                    <p className="Properties__value"><span className={passed ? 'date--passed' : 'date--not-passed'}>{endDate.toLocaleDateString('sv-SE', dateFormat)}</span></p>
                </div>
                <div className="Properties__item">
                    <h3 className="Properties__title icon icon-user">PM</h3>
                    <p className="Properties__value">
                        <a href={userUrl} className="text--link">{user?.fullName ?? 'Unknown'}</a>
                    </p>
                </div>
            </div>
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
        <div className="CodebaseComponent">
            <div className="Properties Properties--column">
                <div className="Properties__item">
                    <h3 className="Properties__title">Referenced tickets</h3>
                    <ul className="Properties__value Properties__value--list ReferencedTickets">
                        { tickets.map((ticket) => {
                            return (
                                <li key={ticket.id} dangerouslySetInnerHTML={{__html: ticket.htmlLink}} />
                            );
                        })}
                    </ul>
                </div>
            </div>
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
            <div className="Properties Properties--column">
                <div className="Properties__item">
                    <h3 className="Properties__title">Blockers</h3>
                    <p className="Properties__value"><span className="empty">None</span></p>
                </div>
            </div>
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
        <div className="Properties__item">
            <h3 className="Properties__title icon icon-tags">Tags</h3>
            <p className="Properties__value Properties__value--tags">
                { items.map((tag) => {
                    return (
                        <span className={tag.class} key={tag.index}>{tag.text}</span>
                    );
                })}
            </p>
        </div>
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
            <div className="Properties Properties--row">
                <div className="Properties__item">
                    <h3 className="Properties__title icon icon-branch">Branch</h3>
                    <p className="Properties__value">
                        <span id="ticket-branch" className="text--code"><a href={url}>{name}</a></span>
                        <CopyButton title="Copy branch link" elementId="#ticket-branch" />
                    </p>
                </div>
            </div>
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
        <div className="Properties Properties--column">
            <div className="Properties__item">
                <h3 className="Properties__title">Commits</h3>
                <ul className="Properties__value Properties__value--list ReferencedTickets">
                </ul>
            </div>
        </div>
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
            <div className="Properties Properties--column">
                <div className="Properties__item">
                    <h3 className="Properties__title">Notifications</h3>
                    <p className="Properties__value">
                        <button className="btn btn--medium icon icon-unsubscribe">Unsubscribe</button>
                    </p>
                    <p className="help">You're receiving notifications because you're subscribed to this ticket.</p>
                </div>
                <div className="Properties__item">
                    <p className="Properties__value">
                        <button className="btn btn--medium icon icon-subscribe">Subscribe</button>
                    </p>
                    <p className="help">You're not receiving notifications from this ticket.</p>
                </div>
            </div>
        </div>
    )
}