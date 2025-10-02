import React from 'react';
import { createRoot } from 'react-dom/client';
import HarvestApp from './HarvestApp';
import { awaitElement, log, addLocationChangeCallback } from './utils';

log('React script has successfully started');

// Do the required initial work. Gets called every time the URL changes,
// so that elements can be re-inserted as a user navigates a page with
// different routes.
async function main() {
    // Find <body/>. This can be any element. We wait until
    // the page has loaded enough for that element to exist.
    const target = await awaitElement('div#content div.right');
    const container = document.createElement('div');
    target.appendChild(container);
    const root = createRoot(container);
    root.render(<HarvestApp />);
}

// Call `main()` every time the page URL changes, including on the first load.
addLocationChangeCallback(() => {
    // Greasemonkey doesn't bubble errors up to the main console,
    // so we have to catch them manually and log them.
    main().catch((e) => {
        log(e);
    });
});
