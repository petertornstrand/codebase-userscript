import React from 'react';
import './styles/CopyButton.css';
import { log } from './utils';

/**
 * CopyButton element.
 *
 * @param {string} title
 * @param {string} [elementId] - Selector of the element whose text is copied.
 * @param {string} [text] - Literal text to copy, used instead of `elementId`.
 * @param {string} [icon] - Icon class.
 * @return {JSX.Element}
 * @constructor
 */
export default function CopyButton({ title, elementId, text, icon = 'icon-copy' }) {

    /**
     * Handle button click.
     * @param {Event} event
     */
    const handleClick = (event) => {
        const value = text ?? document.querySelector(elementId)?.innerText;
        if (value) {
            navigator.clipboard.writeText(value);
        }
    }

    return (
        <div className="CopyButton">
            <button className={`CopyButton__button icon-only ${icon}`} title={title} onClick={handleClick}></button>
        </div>
    );
}