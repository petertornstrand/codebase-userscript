import React from 'react';
import { Tooltip } from 'react-tooltip'

export default function Avatar({ user, size = 'medium', tooltip = true }) {

    let avatar;
    if (user.profile_image) {
        avatar = AvatarImage({ src: user.profile_image.large, alt: user.name, size: size });
    }
    else {
        avatar = AvatarInitials({ initials: user.initials, color: user.color, size: size });
    }

    function renderAvatar() {
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
                                <span className="secondary">{user.name}</span>
                            </a>

                        </p>
                        <p className="Properties__value">
                            <span className="icon icon-role">{user.role}</span>
                        </p>
                        <p className="Properties__value">
                            <span className="icon icon-company">{user.company}</span>
                        </p>
                        <p className="Properties__value">
                            <span className="icon icon-current"></span>
                            <span>{user.location}</span>
                        </p>
                        <p className="Properties__value">
                            <span className="icon icon-drupal"></span>
                            <a href={'https:///www.drupal.org' + user.drupal}>{user.drupal}</a>
                        </p>
                        <p className="Properties__value">
                            <span className="icon icon-mail"></span>
                            <a href={'mailto:' + user.email}>{user.email}</a>
                        </p>
                    </div>
                </Tooltip>
            </div>
        );
    }

    return renderAvatar();
}

function AvatarInitials({ initials, color, size = 'medium' }) {
    return (
        <div className={'avatar avatar--' + color + ' avatar--' + size} data-initials={initials}></div>
    );
}

function AvatarImage({ src, alt, size = 'medium' }) {
    return (
        <img src={src} alt={alt} className={'gravatar gravatar--' + size}/>
    );
}