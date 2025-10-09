import React, { useContext } from 'react';
import { useQuery } from "react-query";
import { createRoot } from 'react-dom/client';
import { CodebaseContext } from "./CodebaseContext.js";
import { URLContext } from './URLContext';
import CopyButton from './CopyButton';
import Avatar from "./Avatar.jsx";
import './styles/TicketSubject.css';

/**
 * Replace the ticket subject.
 *
 * @return {JSX.Element}
 * @constructor
 */
export function ReplaceSubject() {
    const context = useContext(URLContext);
    const container = document.querySelector('h2.Thread__subject.heading--delta');
    const root = createRoot(container);
    root.render(<Subject title={container.innerText} />);

    function Subject({ title }) {
        return (
            <div className="TicketSubject">
                <h2 id="ticket-subject"><span className="TicketId">#{context.id}</span> {title}</h2>
                <CopyButton title="Copy ticket link" elementId="#ticket-subject"/>
                <div className="TicketId__actions">
                    <a className="btn" href={'/projects/' + context.project_id + '/tickets/new'}>New ticket</a>
                    <a className="btn" href={'/projects/' + context.project_id + '/tickets'}>Back to list</a>
                </div>
            </div>
        );
    }
}

/**
 * Replace avatars.
 *
 * @return {JSX.Element}
 * @constructor
 */
export function ReplaceAvatars() {
    const context = useContext(CodebaseContext);
    const { data, status, error } = useQuery('Participants', async () => {
        return await context.api.getUsers('ki-profile');
    });

    if (status === 'loading') return;

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
}

/**
 * Replace ticket links.
 *
 * @return {JSX.Element}
 * @constructor
 */
export function ReplaceTicketLinks() {

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