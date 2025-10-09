import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/Global.css';
import Ticket from './Ticket';
import { awaitElement, log, addLocationChangeCallback } from './utils';

log('React script has successfully started');

// Do the required initial work. Gets called every time the URL changes,
// so that elements can be re-inserted as a user navigates a page with
// different routes.
async function main() {
    // TODO: Replace this with a dynamic initialization function that creates
    //  different components based on the current URL.
    let target = await awaitElement('body');
    let container = document.createElement('div');
    target.appendChild(container);
    let root = createRoot(container);
    root.render(<Ticket />);
}

// Call `main()` every time the page URL changes, including on the first load.
addLocationChangeCallback(() => {
    // Greasemonkey doesn't bubble errors up to the main console,
    // so we have to catch them manually and log them.
    main().catch((e) => {
        log(e);
    });
});
