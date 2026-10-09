import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { createRoot } from 'react-dom/client';
import { log, findCodebaseAvatar, findNotificationChannels, onlyMentionedTickets } from './utils';
import CopyButton from './CopyButton';
import Notice from './Notice';
import { DecoratedTicketLinks, Avatar, api, dateFormat, dateTimeFormat } from './Global';
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

    // Only the original page is in the DOM until the first render with data, so this sees the thread as Codebase rendered it.
    const referencedTickets = useMemo(
        () => onlyMentionedTickets(data?.referencedTickets, id),
        [data, id]
    );

    // The skeleton (see Modern.css) stands in for the page until we have data or an error.
    useEffect(() => {
        if (!isLoading) document.documentElement.classList.remove('cb-ticket-loading');
    }, [isLoading]);

    if (isLoading) return null;

    // Leave the original Codebase page untouched if the data is unavailable.
    if (error || !data?.ticket) {
        log('Unable to load ticket context', error);
        return <Notice message="could not load ticket data. Showing the original page." />;
    }

    return (
        <div className="ReactComponentWrapper">
            <Subject ticket={data.ticket} />
            <Sidebar data={{ ...data, referencedTickets }} projektPermalink={urlContext.project_id} />
            <DecoratedTicketLinks tickets={referencedTickets} />
        </div>
    );
}

/**
 * The original ticket properties (type, status, priority...), detached from
 * the thread header by `Subject` so that `Sidebar` can display them.
 *
 * @type {Element|null}
 */
let detachedProperties = null;

/**
 * Subject element.
 *
 * @param {object} ticket
 *
 * @return {JSX.Element}
 */
function Subject({ ticket }) {
    useEffect(() => {
        const target = document.querySelector('.Thread__header');
        // Keep the original (editable) ticket properties, they are shown in the sidebar.
        detachedProperties = target.querySelector('.js-ticket-properties') ?? detachedProperties;
        const parent = target.parentElement;
        const container = document.createElement('div');
        container.classList.add('TicketSubjectComponent');
        parent.replaceChild(container, target);
        target.remove();
        const root = createRoot(container);
        root.render(
            <div className="TicketSubject">
                <h2 id="ticket-subject" title={`#${ticket.id} ${ticket.subject}`}><span className="TicketId">#{ticket.id}</span> {ticket.subject}</h2>
                <div className="TicketId__actions">
                    <CopyButton title="Copy ticket reference" elementId="#ticket-subject"/>
                    <CopyButton title="Copy ticket link" icon="icon-copy-link" text={`[#${ticket.id} ${ticket.subject}](${window.location.href})`}/>
                    <JumpToLastComment />
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
                        <OriginalProperties />
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
                        <ActionsMenu />
                    </div>
                </div>
            </div>
        );
    }
}

/**
 * Add an "Access" row (Public or Private) to the ticket properties.
 *
 * Codebase shows who can view the ticket as a notice box in the sidebar. For a
 * public ticket it is a `box--positive` saying "This ticket can be viewed by
 * anyone who has access to this project.", for a private ticket it says "This
 * ticket is private. Only users from <company> can view and contribute to this
 * ticket.". The original message is kept as a tooltip and the notice is hidden.
 *
 * @param {Element|null} list - The `ul.TicketProperties` element.
 */
function addAccessProperty(list) {
    const content = Array.from(document.querySelectorAll('#content .right .sidebar__content'))
        .find((element) => /^\s*This ticket/i.test(element.textContent));
    if (!list || !content || list.querySelector('.TicketProperties__column--access')) {
        return;
    }

    const isPublic = !!content.closest('.box--positive') && !/\bis private\b/i.test(content.textContent);
    const column = document.createElement('li');
    column.className = 'TicketProperties__column TicketProperties__column--access';
    const title = document.createElement('h3');
    title.className = 'TicketProperties__title';
    title.textContent = 'Access';
    const value = document.createElement('p');
    value.className = 'TicketProperties__value';
    value.title = content.textContent.replace(/\s+/g, ' ').trim();
    if (isPublic) {
        value.textContent = 'Public';
    } else {
        const label = document.createElement('span');
        label.className = 'TicketProperties__tag col-orange';
        label.textContent = 'Private';
        value.appendChild(label);
    }
    column.append(title, value);
    list.appendChild(column);
    content.closest('.sidebar__module')?.classList.add('userscript-hidden');
}

/**
 * Original ticket properties component.
 *
 * Moves Codebase's own, editable, ticket properties into the sidebar.
 *
 * @return {JSX.Element}
 */
function OriginalProperties() {
    const ref = useRef(null);

    useEffect(() => {
        // Whichever of this and `Subject` runs first takes the element.
        detachedProperties = document.querySelector('.Thread__header .js-ticket-properties') ?? detachedProperties;
        if (ref.current && detachedProperties) {
            ref.current.appendChild(detachedProperties);
            addAccessProperty(detachedProperties.querySelector('.TicketProperties'));
        }
    }, []);

    return <div className="CodebaseComponent SidebarProperties" ref={ref} />;
}

/**
 * Ticket actions drop button.
 *
 * Moves Codebase's own action links (add acceptance criteria, move, make
 * private, split, delete) into a menu. The original elements are kept so that
 * Codebase's behaviour for them still applies.
 *
 * @return {JSX.Element}
 */
function ActionsMenu() {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const list = document.querySelector('#content .right .block-item')?.closest('ul');
        if (!list || !menuRef.current || menuRef.current.contains(list)) {
            return;
        }
        const original = list.closest('.sidebar__module');
        menuRef.current.appendChild(list);
        original?.classList.add('userscript-hidden');
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }
        const close = () => setOpen(false);
        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                close();
            }
        };
        const onKeyDown = (event) => event.key === 'Escape' && close();
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <div className="ActionsMenu" ref={rootRef}>
            <button className="btn ActionsMenu__button" aria-haspopup="menu" aria-expanded={open}
                    onClick={() => setOpen(!open)}>
                Ticket actions
            </button>
            <div className="ActionsMenu__menu" role="menu" hidden={!open} ref={menuRef}
                 onClick={(event) => event.target.closest('a') && setTimeout(() => setOpen(false), 0)} />
        </div>
    );
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
                            <Avatar user={user} size="medium" key={user.id} source={findCodebaseAvatar(user.fullName)} />
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
        // The "add blocker" link is rendered by Codebase. Move it into the
        // component if it is present on the page.
        const parent = document.querySelector('.relationships');
        const link = parent?.querySelector('a');
        const target = document.querySelector('.Blockers');
        if (!link || !target || target.contains(link)) {
            return;
        }
        parent.removeChild(link);
        link.classList.remove('btn', 'btn--neutral');
        link.classList.add('AddBlockersLink', 'icon-only', 'icon-add');
        link.innerText = '';
        target.appendChild(link);
    });

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
            let text = tag;
            if (tag.match(/^branch:/g)) {
                return;
            } else if (tag.match(/^alert:/g)) {
                text = tag.replace(/^alert:/g, '');
                classes.push('col-red', 'icon-status_id');
            } else {
                classes.push('col-grey');
            }
            items.push({
                index: index,
                text: text,
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
 * Notifications block. Shows only the relevant action. The state comes from,
 * and the actions are carried out by, Codebase's own Notifications popout, so
 * Codebase saves the change like it always does.
 *
 * @return {JSX.Element|null}
 */
function Watchers() {
    const [channels, setChannels] = useState(findNotificationChannels);

    useEffect(() => {
        // Codebase toggles the `is-watch` class when a channel is switched.
        const observer = new MutationObserver(() => setChannels(findNotificationChannels()));
        channels.forEach(({ element }) => observer.observe(element, { attributes: true, attributeFilter: ['class'] }));
        return () => observer.disconnect();
    }, []);

    // Without Codebase's popout there is nothing to base the state on.
    if (!channels.length) return null;

    const active = channels.filter((channel) => channel.watching);
    const watching = active.length > 0;

    const toggle = () => {
        if (watching) {
            active.forEach(({ element }) => element.click());
        } else {
            (channels.find((channel) => channel.rel === 'by_email') ?? channels[0]).element.click();
        }
    };

    return (
        <div className="CodebaseComponent">
            <div className="Properties Properties--column">
                <div className="Properties__item">
                    <h3 className="Properties__title">Notifications</h3>
                    <p className="Properties__value">
                        <button className={`btn btn--medium icon ${watching ? 'icon-unsubscribe' : 'icon-subscribe'}`} onClick={toggle}>
                            {watching ? 'Unsubscribe' : 'Subscribe'}
                        </button>
                    </p>
                    <p className="help">
                        {watching
                            ? `You're receiving notifications via ${active.map((channel) => channel.name).join(' and ')}.`
                            : "You're not receiving notifications from this ticket."}
                    </p>
                </div>
            </div>
        </div>
    )
}
