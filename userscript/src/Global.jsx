import React, { useContext, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useQuery } from 'react-query';
import { Tooltip } from 'react-tooltip';
import { URLContext } from './URLContext';
import { log, getCodebaseConfig } from "./utils.js";
import CodebaseAPI, { TICKET_FORMAT } from "./CodebaseAPI.js";
import './styles/Global.css';

/**
 * Date and time format.
 * @type {{year: string, month: string, day: string, hour: string, minute: string}}
 */
export const dateTimeFormat = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute:'2-digit'
};

const config = getCodebaseConfig();

/**
 * Codebase API.
 *
 * @type {CodebaseAPI}
 */
export const api = new CodebaseAPI(config);

/**
 * Date format.
 * @type {{year: string, month: string, day: string}}
 */
export const dateFormat = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
};

/**
 * Ticket link element.
 *
 *
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.text
 * @param {string} props.href
 * @param {string} props.title
 * @param {string} props.rel
 * @param {string} props.class
 *
 * @return {JSX.Element}
 */
export function TicketLink({ props }) {
    return (
        <a className={'TicketLink ' + props.class} href={props.href} rel={props.rel} title={props.title} data-replaced="true">
            <span className="TicketLink__id">#{props.id}</span> <span className="TicketLink__subject">{props.text}</span>
        </a>
    );
}

/**
 * Replace links to tickets with TicketLink elements.
 *
 * @return {void}
 */
export function DecoratedTicketLinks() {
    const links = Array.from(document.querySelectorAll('#content a[rel="codebase-internal"]:not(.TicketLink)'));
    const found = [];
    links.forEach((link) => {
        found.push(link.href.split('/').pop());
    });
    const ids = found.filter((value, index, array) => array.indexOf(value) === index);

    const urlContext = useContext(URLContext);
    const project_id = 'ki-profile'; // TODO: Change to use urlContext.project_id.

    const { data, status, error } = useQuery(['MinimalTickets', ids], async () => {
        return await api.getMultipleTickets(project_id, ids, TICKET_FORMAT.MIN);
    }, { refetchOnMount: false, refetchOnWindowFocus: false});

    if (status === 'loading') return;

    links.forEach((link) => {
        const linkId = parseInt(link.href.split('/').pop());
        const match = data.find((v) => v.id === linkId);
        const parent = link.parentElement;
        const template = document.createElement('template');
        template.innerHTML = match.htmlLink;
        parent.replaceChild(template.content.firstChild, link);
        link.remove();
    });
}

/**
 * Replace avatars.
 *
 * @return {JSX.Element}
 */
export function DecoratedAvatars() {
    const urlContext = useContext(URLContext);
    const project_id = 'ki-profile'; // TODO: Change to use urlContext.project_id.
    const { data, status, error } = useQuery(['Participants', project_id], async () => {
        return await api.getUsers(project_id);
    }, { refetchOnMount: false, refetchOnWindowFocus: false});

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
        const matches = data.filter((v) => v.fullName === name);

        const size = parent.classList.contains('Post__header') ? 'medium' : 'small';

        if (matches.length) {
            const root = createRoot(container);
            root.render(<Avatar user={matches[0]} size={size} tooltip={false} />);
        }
    });
}

/**
 * Avatar element.
 *
 * @param {object} user
 * @param {string} [size]
 * @param {boolean} [tooltip]
 *
 * @return {JSX.Element}
 */
export function Avatar({ user, size = 'medium', tooltip = true }) {

    let avatar;
    if (user.profileImage) {
        avatar = AvatarImage({ src: user.profileImage.large, alt: user.name, size: size, id: user.id });
    }
    else {
        avatar = AvatarInitials({ initials: user.initials, color: user.color, size: size, id: user.id });
    }

    if (!tooltip) {
        return (
            <div className={'Avatar Avatar--' + size}>
                {avatar}
            </div>
        );
    }

    return (
        <div className={'Avatar Avatar--' + size}>
            <a id={'Avatar--' + user.id}
               data-tooltip-place="bottom"
               data-tooltip-variant="light">
                {avatar}
            </a>
            <Tooltip anchorSelect={'#Avatar--' + user.id} clickable className="Tooltip">
                <div className="Properties Properties--column Properties--tight">
                    <p className="Properties__value">
                        <a href={user.url}>
                            <span className="primary">@{user.username}</span>&nbsp;
                            <span className="secondary">{user.fullName}</span>
                        </a>

                    </p>
                    <TooltipProperty user={user} property="role" icon="icon-title" value={user.role} />
                    <TooltipProperty user={user} property="company" icon="icon-company" value={user.company} />
                    <TooltipProperty user={user} property="location" icon="icon-current" value={user.location} />
                    <TooltipLinkedProperty user={user} property="drupal" icon="icon-drupal" value={user.drupal} link="https:///www.drupal.org" />
                    <TooltipLinkedProperty user={user} property="email" icon="icon-mail" value={user.email} link="mailto:" />
                </div>
            </Tooltip>
        </div>
    );
}

/**
 * Tooltip property element.
 *
 * @param user
 * @param property
 * @param icon
 * @param value
 * @return {JSX.Element|null}
 */
function TooltipProperty({ user, property, icon, value }) {
    if (!user.hasOwnProperty(property)) {
        return null;
    }

    return (
        <p className="Properties__value">
            <span className={'icon ' + icon}>{value}</span>
        </p>
    );
}

/**
 * Tooltip linked property element.
 *
 * @param user
 * @param property
 * @param icon
 * @param value
 * @param link
 * @return {JSX.Element|null}
 */
function TooltipLinkedProperty({ user, property, icon, value, link }) {
    if (!user.hasOwnProperty(property)) {
        return null;
    }

    return (
        <p className="Properties__value">
            <span className={'icon ' + icon}></span>
            <a href={link + value}>{value}</a>
        </p>
    );
}

/**
 * Avatar initials element.
 *
 * @param {string} initials
 * @param {int} id
 * @param {string} [color]
 * @param {string} [size]
 *
 * @return {JSX.Element}
 */
function AvatarInitials({ initials, id, color = 'darkblue', size = 'medium' }) {
    return (
        <div className={'avatar avatar--' + color + ' avatar--' + size} data-initials={initials} data-id={id}></div>
    );
}

/**
 * Avatar image element.
 *
 * @param {string}src
 * @param {int} id
 * @param {string} alt
 * @param {string} [size]
 *
 * @return {JSX.Element}
 */
function AvatarImage({ src, id, alt, size = 'medium' }) {
    return (
        <img src={src} alt={alt} className={'gravatar gravatar--' + size} data-id={id} />
    );
}