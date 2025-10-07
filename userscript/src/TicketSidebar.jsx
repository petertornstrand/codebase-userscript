import React, { useContext, useState } from 'react';
import {QueryClient,QueryClientProvider,useQuery} from "react-query";
import './styles/TicketSidebar.css';
import CopyButton from './CopyButton';
import Avatar from './Avatar';
import { CodebaseContext } from './CodebaseContext';
import { log } from './utils';

const queryClient = new QueryClient();

/**
 * Ticket sidebar element.
 *
 * @return {JSX.Element}
 * @constructor
 */
export default function TicketSidebar() {
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
                            <ul className="Properties Properties--column">
                                <Milestone />
                                <ReferencedTickets />
                                <Blockers />
                            </ul>
                        </div>
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <Tags />
                                <Branch />
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
    const date = document.querySelector(".ThreadMeta ul.layout-list .ThreadMeta__item.icon-user span.timestamp").innerHTML;
    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Reported by</h3>
            <p className="Properties__value Properties__value--long">
                <span className="user" dangerouslySetInnerHTML={{__html: user}} /> <span className="date">{date}</span>
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
    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Milestone</h3>
            <p className="Properties__value Properties__value--long">
                <span className="primary"><a href="">Rel 2025-86</a></span> due <span
                className="date">October 23rd, 2025</span> &ndash; <span className="user"><a
                href="#">Erik P</a></span>
            </p>
        </li>
    );
}

function ReferencedTickets() {
    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Referenced tickets</h3>
            <div className="Properties__value Properties__value--list">
                <p className="Properties__value">
                    <a className="is-status-completed" href="#">#3434 Roller saknar rättighet att lägga till bilder</a>
                </p>
                <p className="Properties__value">
                    <a className="is-status-new" href="#">#3436 Ändra text på engelska programsidor</a>
                </p>
                <p className="Properties__value">
                    <a className="is-status-invalid" href="#">#332 Cron has not run for over 4 hours on fedora</a>
                </p>
            </div>
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
    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Tags</h3>
            <p className="Properties__value Properties__value--tags">
                <span className="TicketProperties__tag">Needs test</span>
                <span className="TicketProperties__tag">Intermediate</span>
            </p>
            <p className="Properties__value hidden"><span className="empty">No tags</span></p>
        </li>
    );
}

function Branch() {
    return (
        <li className="Properties__item">
            <h3 className="Properties__title">Branch</h3>
            <p className="Properties__value">
                <span id="ticket-branch" className="text--code icon icon-branch"><a href="https://code.happiness.se/projects/ki-profile/repositories/kimulti/tree/3434-ladok-editor-qbank">3434-ladok-roles-qbank</a></span>
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