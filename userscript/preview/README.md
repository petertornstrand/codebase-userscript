# Live preview

Work on UI changes against saved Codebase pages, with hot reload and a mock
API, without touching the real Codebase or installing the userscript.

```
cd userscript
ddev npm run dev
```

Open <https://codebase.ddev.site:8125/>. It lists the available pages. Edit
anything in `src/` and the page reloads.

## What it does

- Serves the HTML files in `preview/pages/` at the same URL path they were saved
  from, so the userscript's URL based routing works unchanged.
- Strips Codebase's own scripts (add `?js` to the URL to keep them), and injects
  the userscript source straight from `src/` (not the built file).
- Provides `GM_getValues` and friends (`preview/shim.js`).
- Mocks the Codebase API Gateway at `/__api/`. The ticket context comes from
  `preview/mocks/context.json`, or `preview/mocks/context-<ticket id>.json` when
  that exists. Add `?delay=2000` to the context request to test slow responses
  and delete the mock file to test the failure notice.

## Saving a page

The most faithful and least fiddly way is the
[SingleFile](https://github.com/gildas-lormeau/SingleFile) browser extension.
It saves one self-contained `.html` file (styles, fonts and images inlined).
Put it in `preview/pages/`. It records the page URL, which the preview uses to
serve it at the right path.

Alternatively save a Codebase page in Chrome with _Save as → Webpage, Complete_ and put the
`.html` file and its `_files` folder in `preview/pages/`. Chrome writes a
`saved from url` comment that tells the preview which URL path the page
belongs to. If a page has no such comment, map it in `preview/pages.json`:

```json
{ "my-ticket.html": "/projects/acme/tickets/3434" }
```

`preview/pages/` is git ignored because saved pages contain private data.
`preview/samples/` has a synthetic ticket page that is used when no real page
matches.

## Notes

- Make sure the mock context matches the ticket in the saved page, or the
  userscript will decorate it with data for a different ticket.
- The script's own browser-only behaviour (userscript manager, real API) is not
  covered. Use the built script (`ddev npm run build:watch`) for that.

## Screenshots

`preview/shot.mjs` takes a headless Chromium screenshot of a preview page, so
changes can be checked without a browser. It needs Playwright, which is not a
project dependency. In DDEV (once per container):

```
ddev exec "cd userscript && npm i --no-save playwright && npx playwright install chromium && sudo npx playwright install-deps chromium"
```

Then, with the dev server running:

```
ddev exec "cd userscript && node preview/shot.mjs /projects/acme/tickets/3434 /var/www/html/userscript/preview/shot.png 1440 900"
```

Set `FULL=1` for a full page screenshot. The images are git ignored.
