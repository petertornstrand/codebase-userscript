import React, { useContext, useState, useEffect } from 'react';
import { ReactDOM } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {QueryClient,QueryClientProvider,useQuery} from "react-query";
import './styles/TicketSidebar.css';
import CopyButton from './CopyButton';
import Avatar from './Avatar';
import { parseDate } from 'date-parrot'
import { CodebaseContext } from './CodebaseContext';
import { log } from './utils';

const queryClient = new QueryClient();
const dateTimeFormat = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute:'2-digit'
};
const dateFormat = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
};

/**
 * Ticket sidebar element.
 *
 * @return {JSX.Element}
 * @constructor
 */
export default function TicketSidebar() {
    ReplaceTicketLinks();

    return (
        <QueryClientProvider client={queryClient} contextSharing={true}>
            <div className="sidebar__module sidebar__module--medium">
                <div className="box box--sidebar">
                    <div className="island">
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <Reporter />
                                <Participants />
                            </ul>
                        </div>
                        <div className="CodebaseComponent">
                            <Milestone />
                        </div>
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <ReferencedTickets />
                                <Blockers />
                            </ul>
                        </div>
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <Tags />
                                <Branch />
                            </ul>
                        </div>
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <Access />
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </QueryClientProvider>
    );
}

function Reporter() {
    const user = document.querySelector(".ThreadMeta ul.layout-list .ThreadMeta__item.icon-user span.text--bold").innerHTML;
    const date = document.querySelector(".ThreadMeta ul.layout-list .ThreadMeta__item.icon-user span.timestamp").getAttribute('title');
    const parsedDate = new Date(Date.parse(date));

    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Reported by</h3>
            <p className="Properties__value">
                <span className="user" dangerouslySetInnerHTML={{__html: user}} /> on {parsedDate.toLocaleString('sv-SE', dateTimeFormat)}
            </p>
        </li>
    );
}

function Participants() {

    const context = useContext(CodebaseContext);
    const [participants,setParticipants] = useState([]);

    const { data, status, error } = useQuery('Participants', async () => {
        return await context.api.getUsers('ki-profile');
    });

    if (status === 'loading') return ( <p className="Loading">Loading...</p> );
    if (error) return ( <p className="Error">{error.message}</p> );

    if (participants.length === 0) {
        // Extract the author names and images from the posts.
        const posts = [];
        document.querySelectorAll("li.Post.Post--full").forEach((elem) => {
            const post = {
                name: elem.querySelector(".Post__meta > .text--bold > a").innerText,
                url: elem.querySelector(".Post__meta > .text--bold > a").href,
                image: elem.querySelector("img.Post__avatar").src,
            };
            posts.push(post);
        });

        // Remove duplicates from the array.
        const uniqueAuthors = posts.filter((v, i, a) => {
            return a.findIndex(v => v.image === a[i].image) === i;
        });

        // Decorate each author with the matching post from the Codebase API.
        uniqueAuthors.forEach((v, i, a) => {
            const matches = data.filter((v) => v.name === a[i].name);
            a[i] = Object.assign({}, v, matches[0]);
        });

        setParticipants(uniqueAuthors);
    }

    const renderParticipants = () => {
        if (participants.length === 0) {
            return null;
        }

        return (
            <div className="Participant__list">
                { participants.map((participant) => {
                    return (
                        <Avatar user={participant} size="large" key={participant.id} />
                    );
                })}
            </div>
        );
    }

    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Participants</h3>
            <div className="Properties__value--tags">
            {renderParticipants()}
            </div>
        </li>
    );
}

function Milestone() {
    const milestone = document.querySelector(".sidebar__module .related-milestone__heading a");
    const date = parseDate(document.querySelector(".sidebar__module .related-milestone__date").innerText);
    const passed = (() => Date.parse(date.date) < Date.now());
    const user = document.querySelector(".sidebar__module .box__footer .text--bold").innerHTML;
    const data = {
        name: milestone.getAttribute('title'),
        link: milestone.getAttribute('href'),
        date: new Date(Date.parse(date.date)),
        user: user,
        passed: passed() ? 'date--passed' : 'date--not-passed'
    };
    return (
        <ul className="Properties Properties--row">
            <li className="Properties__item">
                <h3 className="Properties__title icon icon-milestone">Milestone</h3>
                <p className="Properties__value">
                    <span className="primary"><a href={data.link}>{data.name}</a></span>
                </p>
            </li>
            <li className="Properties__item">
                <h3 className="Properties__title icon icon-calendar">Due</h3>
                <p className="Properties__value"><span className={data.passed}>{data.date.toLocaleDateString('sv-SE', dateFormat)}</span></p>
            </li>
            <li className="Properties__item">
                <h3 className="Properties__title icon icon-user">PM</h3>
                <p className="Properties__value">
                    <span className="user" dangerouslySetInnerHTML={{__html: data.user}} />
                </p>
                <p className="Properties__value hidden"><span className="empty">No milestone</span></p>
            </li>
        </ul>
    );
}

function ReferencedTickets() {

    // TODO: Links not found! Use the new API instead.

    useEffect(()=>{
        const references = document.querySelectorAll('li.Post a[rel="codebase-internal"]');
        log(document.querySelectorAll('a[rel]'));
        references.forEach((element) => {
            const ref = element.cloneNode(true);
            const container = document.querySelector('ul.ReferencedTickets');
            const item = document.createElement('li');
            item.classList.add('Properties__value');
            item.appendChild(ref);
            container.appendChild(item);
        });

        if (references.length === 0) {
            const container = document.querySelector('ul.ReferencedTickets');
            const item = document.createElement('li');
            item.classList.add('Properties__value');
            item.innerHTML = '<span className="empty">No references</span>';
            container.appendChild(item);
        }
    }, [])

    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Referenced tickets</h3>
            <ul className="Properties__value Properties__value--list ReferencedTickets">
            </ul>
        </li>
    )
}

function Blockers() {
    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Blockers</h3>
            <p className="Properties__value"><span className="empty">None</span></p>
        </li>
    );
}

function Tags() {
    const elements = document.querySelectorAll('.TagList .TagList__item span.js-tags-text');

    const tags = [];
    elements.forEach(function (e, i) {
        let elem = e.cloneNode(true);
        elem.classList.add('icon');
        if (elem.innerText.match(/^branch:/g)) {
            elem.innerText = elem.innerText.replace(/^branch:/g, '');
            elem.classList.add('col-orange', 'icon-branch');
        }
        else if (elem.innerText.match(/^note:/g)) {
            elem.innerText = elem.innerText.replace(/^note:/g, '');
            elem.classList.add('col-red', 'icon-status_id');
        }
        else {
            elem.classList.remove('icon');
            elem.classList.add('col-grey');
        }
        elem.classList.replace('js-tags-text', 'TicketProperties__tag');
        tags.push({
            index: i,
            text: elem.innerText,
            class: elem.classList.toString(),
        });
        elem.remove();
    });

    function renderTags() {
        if (tags.length === 0) {
            return (
                <p className="Properties__value"><span className="empty">No tags</span></p>
            );
        }

        return (
            <p className="Properties__value Properties__value--tags">
                { tags.map((tag) => {
                    return (
                        <span className={tag.class} key={tag.index}>{tag.text}</span>
                    );
                })}
            </p>
        );
    }

    return (
        <li className="Properties__item">
            <h3 className="Properties__title icon icon-tags">Tags</h3>
            {renderTags()}
        </li>
    );
}

function Branch() {
    return (
        <li className="Properties__item">
            <h3 className="Properties__title icon icon-branch">Branch</h3>
            <p className="Properties__value">
                <span id="ticket-branch" className="text--code"><a href="https://code.happiness.se/projects/ki-profile/repositories/kimulti/tree/3434-ladok-editor-qbank">3434-ladok-roles-qbank</a></span>
                <CopyButton title="Copy branch link" elementId="#ticket-branch" />
            </p>
            <p className="Properties__value hidden"><span className="empty">No branch configured</span></p>
        </li>
    );
}

function Access() {
    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Access</h3>
            <p className="Properties__value"><span className="icon icon-unlock">Anyone with access</span></p>
            <p className="Properties__value text--negative hidden"><span className="icon icon-lock">Only users from <strong>Happiness</strong></span></p>
        </li>
    );
}

export function ReplaceAvatars() {
    const context = useContext(CodebaseContext);
    const { data, status, error } = useQuery('Participants', async () => {
        return await context.api.getUsers('ki-profile');
    });

    if (status === 'loading') return ( <p className="Loading">Loading...</p> );
    if (error) return ( <p className="Error">{error.message}</p> );

    const avatars = document.querySelectorAll('.Thread__timeline .ThreadChanges__event:not([data-replaced="true"]), .Thread__timeline .Post__header:not([data-replaced="true"])');
    avatars.forEach((avatar) => {
        const image = avatar.querySelector('img.Post__avatar, img.ThreadChanges__avatar');
        const parent = image.parentElement;
        const container = document.createElement('div');
        image.classList.forEach((v) => container.classList.add(v));
        parent.replaceChild(container, image);
        avatar.setAttribute('data-replaced', 'true');

        const name = avatar.querySelector('.text--bold > a.text--link').innerText;
        const matches = data.filter((v) => v.name === name);

        if (matches.length) {
            const root = createRoot(container);
            root.render(<Avatar user={matches[0]} size="small" tooltip={false} />);
        }
    });

    return (
        <div></div>
    );
}

function ReplaceTicketLinks() {

    function TicketLink({ props }) {
        return (
            <a className={props.class} href={props.href} rel={props.rel} title={props.title}  data-replaced="true"><span className="id">#{props.id}</span> <span className="subject">{props.text}</span></a>
        );
    }

    const links = document.querySelectorAll('#content .left a[rel="codebase-internal"]:not([data-replaced="true"])');
    links.forEach((link) => {
        link.classList.remove('text--positive', 'text-subtle');
        const props = {
            id: link.innerText.match(/\d+/)[0],
            text: link.innerText.replace(/^#\d+\s-\s/, ''),
            href: link.href,
            title: link.classList.item(0).replace('is-status-', '').replace('-',' '),
            rel: 'codebase-internal',
            class: link.classList.toString()
        };

        const parent = link.parentElement;
        const placeholder = document.createElement('span');
        parent.replaceChild(placeholder, link);
        const root = createRoot(placeholder);
        root.render(<TicketLink props={props} />);
    });
}