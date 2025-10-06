import React from 'react';
import './styles/CopyButton.css';
import { log } from './utils';

/**
 * CopyButton element.
 *
 * @param {string} title
 * @param {string} elementId
 * @return {JSX.Element}
 * @constructor
 */
export default function CopyButton({ title, elementId }) {

    /**
     * Handle button click.
     * @param {Event} event
     */
    const handleClick = (event) => {
        const element = document.querySelector(elementId);
        let promise = navigator.clipboard.writeText(element.innerText)
    }

    return (
        <div className="CopyButton">
            <button className="CopyButton__button icon-only icon-copy" title={title} onClick={handleClick}></button>
        </div>
    );
}