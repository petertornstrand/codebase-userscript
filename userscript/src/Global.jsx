import React, { useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { Tooltip } from 'react-tooltip';
import Loading from "./styles/Loading.svg?react";
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
 * @param {Array} tickets
 * @param {string} projectPermalink
 *
 * @return {void}
 */
export function DecoratedTicketLinks({ tickets, projectPermalink }) {
    const links = Array.from(document.querySelectorAll('#content a[rel="codebase-internal"]:not(.TicketLink)'));

    useEffect(() => {
        links.forEach((link) => {
            const linkId = parseInt(link.href.split('/').pop());
            const ticket = tickets.find((v) => v.id === linkId);
            const parent = link.parentElement;
            const container = document.createElement('div');
            container.classList.add('ReactComponentWrapper');
            container.innerHTML = ticket.htmlLink;
            parent.replaceChild(container, link);
            link.remove();
        });
    }, [links]);
}

/**
 * Avatar element.
 *
 * Shows a copy of `source` (the avatar image Codebase renders for the user) if
 * given, otherwise the user's profile image, otherwise their initials.
 *
 * @param {object} user
 * @param {string} [size]
 * @param {Element|null} [source]
 *
 * @return {JSX.Element}
 */
export function Avatar({ user, size = 'medium', source = null }) {
    let avatar;
    if (source) {
        avatar = <AvatarClone source={source} size={size} id={user.id} name={user.fullName} />;
    }
    else if (user.profileImage) {
        avatar = AvatarImage({ src: user.profileImage.large, alt: user.fullName ?? user.name, size: size, id: user.id });
    }
    else {
        avatar = AvatarInitials({ initials: user.initials, color: user.color, size: size, id: user.id });
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
 * Avatar copied from an image element Codebase has rendered.
 *
 * @param {Element} source
 * @param {int} id
 * @param {string} [size]
 *
 * @return {JSX.Element}
 */
function AvatarClone({ source, id, name, size = 'medium' }) {
    const ref = useRef(null);

    useEffect(() => {
        const image = source.cloneNode(true);
        const sizes = { small: 16, medium: 32, large: 56 };
        if (source.classList.contains('InitialsAvatar')) {
            // Initials instead of a placeholder, see avatars.js.
            image.className = 'InitialsAvatar';
            image.style.setProperty('--size', `${sizes[size] ?? 32}px`);
        } else {
            image.className = 'gravatar gravatar--' + size;
            image.removeAttribute('width');
            image.removeAttribute('height');
            image.dataset.id = id;
            // So that a placeholder can be replaced by the initials of this user, see avatars.js.
            if (name) image.dataset.name = name;
            delete image.dataset.avatarChecked;
        }
        ref.current.replaceChildren(image);
    }, [source]);

    return <span className="AvatarClone" ref={ref} />;
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

/**
 * Loading component.
 *
 * @return {JSX.Element}
 */
export function ComponentLoading() {
    return (
        <div className="CodebaseComponent CodebaseComponent--loading">
            <Loading />
        </div>
    );
}