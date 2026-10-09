# Codebase Userscript

A userscript that improves the [Codebase](https://www.codebasehq.com/) project
management application. It restyles the ticket page, adds a project scoped
search, and adds a summary of the tickets you worked on today.

It is written with [Preact](https://preactjs.com/) (through `preact/compat`, so
the code and libraries use the React API) and built with [Vite](https://vite.dev/).
The project is based on the [React userscript template](https://github.com/siefkenj/react-userscripts/)
by [Jason Siefken](https://github.com/siefkenj), and replaces the separate
scripts that used to live in the `greasemonkey` repository.

The script runs on:

- `https://code.happiness.se/*`
- `https://happiness.codebasehq.com/*`

## Features

### Ticket page

Ticket pages are rebuilt using data from the Codebase API (see
[Configuration](#configuration)).

#### New ticket header

- Adds the ticket ID before the title.
- Adds a **Copy ticket reference** button (`#123 Subject`) for easy pasting
  into time tracking entries.
- Adds a **Copy ticket link** button that copies a Markdown link,
  `[#123 Subject](url)`.
- Adds a **Last comment** button that scrolls the latest comment into view.
- Makes the header sticky.
- Updates the styling of the status and priority fields.

#### New sidebar

Replaces the right sidebar with a modern looking and information dense version
based on the GitHub issue sidebar.

- **Reporter** and the date the ticket was reported.
- **Participants**: all users who have taken part in the ticket, shown as
  avatars (the user's profile image, or their initials on a color derived from
  the company name). Hovering an avatar displays additional user information.
- **Milestone**: a compact version that does not use more space than needed,
  with due date and project manager.
- **Referenced tickets**: lists all tickets referenced in the ticket.
- **Blockers**: moves the hidden "Blockers" feature into plain sight.
- **Tags**: moved into the sidebar. Tags with the prefix `alert:` are
  highlighted.
- **Branch**: displays the branch associated with the ticket, based on a tag
  named like `branch:1023-branch-name`.
- **Notifications**: shows only the relevant action, Subscribe or Unsubscribe.
  The state and the action use Codebase's own Notifications popout, so
  Codebase saves the change as usual. Subscribe turns on email notifications,
  Unsubscribe turns off every channel that is on.

#### Decorated ticket links

Links to tickets in comments are decorated with additional information.

#### Comments with tasks

Comments that contain task lists are highlighted.

### Project pages

- **Project search**: the header search is moved to the center of the header
  and limited to the current project.
- **Open tickets by default**: the "Tickets" menu link only lists open tickets
  (`status:open`).

### User pages

Adds a list of the tickets worked on today, grouped by project, to the top of
the user activity feed. Handy for copying into a time tracker.

### Fallback

If the API or the configuration is unavailable, the ticket page is left as
Codebase renders it and a small notice is shown in the bottom right corner.
The features that do not use the API (project and user page improvements and
the highlighting of comments with tasks) keep working.

## Install

1. Install a userscript manager, for example
   [Violentmonkey](https://violentmonkey.github.io/).
2. Open the [latest release](https://github.com/petertornstrand/codebase-userscript/releases/latest)
   and click on the file `codebase.user.js`. Your userscript manager should
   pick up on the script and present you with an installation screen.
   You can also open this URL directly:
   <https://github.com/petertornstrand/codebase-userscript/releases/latest/download/codebase.user.js>
3. Add the [configuration](#configuration) below. Without it the ticket page
   improvements are disabled.
4. If you have used the old `greasemonkey` scripts, disable them. Otherwise
   both versions will run and decorate the page twice.

The script does not update itself. To update, install the new release.

## Configuration

The ticket page needs access to the Codebase API through the
[Codebase API Gateway](https://github.com/petertornstrand/cbapi), a separate
project that this userscript uses to communicate with the Codebase API.

The settings are stored in your userscript manager. If you are using
Violentmonkey:

1. Open the dashboard and click on the _Edit_ button for the script.
2. Click the _Values_ tab.
3. Click the _Show/edit the entire value storage_ link.
4. Paste the following JSON into the text area to the right and fill in the
   values:
   ```json
   {
      "cbapi_base_url": "<CBAPI_BASE_URL>",
      "cbapi_key": "<CBAPI_KEY>",
      "cb_username": "<CB_USERNAME>",
      "cb_key": "<CB_KEY>"
   }
   ```

| Key              | Description                                          |
|------------------|------------------------------------------------------|
| `cbapi_base_url` | URL of the Codebase API Gateway.                     |
| `cbapi_key`      | API key for the Codebase API Gateway.                |
| `cb_username`    | Your Codebase API username.                          |
| `cb_key`         | Your Codebase API key.                               |

## Development

The source is in the `userscript` directory. [DDEV](https://ddev.com/) is used
to provide Node.js and to serve the built script.

Clone the repository and start the environment from the repository root:

```
git clone git@github.com:petertornstrand/codebase-userscript.git
cd codebase-userscript
ddev start
```

Install the dependencies and build the script. Run the `npm` commands from the
`userscript` directory:

```
cd userscript
ddev npm install
ddev npm run build:watch
```

`build:watch` rebuilds `dist/codebase.user.js` whenever a file changes.

Visit <https://codebase.ddev.site/codebase.user.js> and install the userscript
via your userscript manager. Add the [configuration](#configuration) to the
development script as well. Disable the released version while developing,
otherwise both will run.

### Live preview

To work on UI changes with hot reload, without installing the userscript or
using the real Codebase, run `ddev npm run dev` from the `userscript` directory
and open <https://codebase.ddev.site:8125/>. It serves pages you have saved from
Codebase with the userscript injected, and a mock API. See
[`userscript/preview/README.md`](userscript/preview/README.md).

### Project structure

| Path                              | Description                                           |
|-----------------------------------|-------------------------------------------------------|
| `userscript/src/index.jsx`        | Entry point. Runs the right features for the URL.     |
| `userscript/src/userscript-header.js` | Userscript header (name, version, `@match`, `@grant`). |
| `userscript/src/Ticket.jsx`       | Ticket page components (header, sidebar).             |
| `userscript/src/Global.jsx`       | Shared components (avatars, decorated links) and the API client instance. |
| `userscript/src/CodebaseAPI.js`   | Client for the Codebase API Gateway.                  |
| `userscript/src/pages/`           | Plain DOM improvements for project, user and ticket pages. |
| `userscript/src/styles/`          | CSS, inlined into the built script.                   |
| `userscript/src/test/`            | Test fixtures.                                        |
| `userscript/preview/`             | Live preview (dev server plugin, mock API, sample page). |

### Testing

Tests use [Vitest](https://vitest.dev/) with jsdom. Run them from the
`userscript` directory:

```
ddev npm test            # single run
ddev npm run test:watch  # re-run on change while developing
```

The tests run against Preact, like the build. The Codebase API is mocked, and
the Codebase page markup is represented by small fixtures in
`userscript/src/test/fixtures.js`. Update the fixtures if Codebase changes its
markup.

### Releasing

1. Update `@version` in `userscript/src/userscript-header.js`.
2. Run the tests and build the script:
   ```
   cd userscript
   ddev npm test
   ddev npm run build
   ```
3. Create a GitHub release and attach `dist/codebase.user.js`:
   ```
   gh release create vX.Y.Z dist/codebase.user.js
   ```
