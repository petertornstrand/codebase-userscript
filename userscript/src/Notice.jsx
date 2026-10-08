import React from 'react';

/**
 * Error notice shown when the userscript can't decorate the page.
 *
 * @param {string} message
 *
 * @return {JSX.Element}
 */
export default function Notice({ message }) {
    return (
        <div className="CodebaseComponent CodebaseComponent--error" role="alert">
            Userscript: {message}
        </div>
    );
}
