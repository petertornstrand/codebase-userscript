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

### Modern look

The whole interface gets a GitHub inspired look: a restyled site header and
navigation, mono colour icons (GitHub Octicons) instead of Codebase's icon
font and bitmaps, rounded comment cards and boxes, buttons, tabs, pagination
and tables. It is applied with CSS on top of Codebase's own markup, so the
original links and scripts keep working.

### Avatars

Codebase's grey placeholder avatar, which people without a picture get, is
replaced everywhere (feed, comments, members, participants) by their initials
on a colour that follows their name. A placeholder is recognised by how the
image looks: bright, grey and flat. Real pictures are left alone.

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
  The copy and last comment actions are icon buttons next to the title.
- Makes the header sticky.
- Updates the styling of the status and priority fields.
- Shows a loading skeleton, with the title and placeholders for the sidebar,
  while the ticket data is fetched.

#### Comments and timeline

- Comment cards with a header, the author's Codebase avatar and an icon button
  for "Edit this update".
- Ticket changes (status, assignee...) are listed as timeline events with the
  same spacing whatever the type of change.
- The ticket detail tabs (Change Details, Progress and Deadlines...) and the
  "Post a response" box match the rest of the interface.

#### New sidebar

Replaces the right sidebar with a modern looking and information dense version
based on the GitHub issue sidebar.

- **Reporter** and the date the ticket was reported.
- **Ticket properties**: type, status, priority and so on, plus **Access**
  (Public or Private).
- **Participants**: all users who have taken part in the ticket, shown with
  their regular Codebase avatars. Hovering an avatar displays additional user
  information.
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
- **Ticket actions**: the ticket links (add acceptance criteria, move, make
  private, delete...) are collected in a drop-button.

#### Mentions

@mentions in comments and in the activity feed show a name, `@Vito K.`, instead
of the handle, `@vito-kasim-31`. The handle is the tooltip. The name comes from
the project's users, from a matching name on the page, or from the handle itself
when it has several parts. A handle that can't be turned into a name is left as
it is.

#### Decorated ticket links

Links to tickets in comments are decorated with additional information.

#### Comments with tasks

Comments that contain task lists are highlighted.

### Project pages

- **Project search**: the header search is moved to the center of the header
  and limited to the current project.
- **Open tickets by default**: the "Tickets" menu link only lists open tickets
  (`status:open`).

#### Project overview

- The activity feed is a clean list: avatar, a sentence with the event type,
  the time on the right and the details below.
- **Quick stats** are remade as a compact card at the top of the right sidebar.
- **Who's on this project** is a row of avatars, like the ticket participants.
- **Project settings** is a drop-button.
- The ticket counts are tiles with a bar showing the share of open tickets,
  instead of the pie chart, and the milestones are listed with their due date.
- "Never group similar events" and "Subscribe with RSS" are small buttons.

#### Milestone page

Underlined tabs, cards for the description, properties and ticket stats, a
progress bar instead of the pie chart, and one table per user with the
tickets coloured by status.

#### Milestones

One card per milestone with the description, dates and who is responsible,
tiles for new, open and closed tickets and a progress bar instead of the pie
chart.

#### Ticket list

A search field with a button, modern pagination and a table with fixed
columns, status pills and a tidy footer with the Kanban and CSV links.

### Dashboard

- **Recent activity** at the top of the right sidebar, derived from the activity
  feed that is on the page: the number of events, tickets and commits, the
  busiest projects and the most active people.
- **Your Projects** is a plain list that scrolls when it is long.
- The activity feed gets the same clean layout as the project overview, including
  created and deleted branches in the details of a push.
- The **project view** (events grouped by project) has a heading per project with
  its icon and a link to all its events.

### Browse Projects

The "Your Projects" page has underlined tabs (Active, On Hold, Archived), one
section per company and the projects as small cards with a status pill.

### Project browser

The "Projects" popover in the site header is restyled: your projects with the
number of tickets assigned to you, and all projects with a filter, status
pills and the hover highlight.

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

### Icons

The mono colour icons are generated from GitHub Octicons. To add or change an
icon, edit the mapping tables in `userscript/scripts/generate-icons.mjs` and run
`ddev npm run icons` from the `userscript` directory. Do not edit
`src/styles/Icons.css` by hand.

### Project structure

| Path                              | Description                                           |
|-----------------------------------|-------------------------------------------------------|
| `userscript/src/index.jsx`        | Entry point. Runs the right features for the URL.     |
| `userscript/src/userscript-header.js` | Userscript header (name, version, `@match`, `@grant`). |
| `userscript/src/Ticket.jsx`       | Ticket page components (header, sidebar).             |
| `userscript/src/Global.jsx`       | Shared components (avatars, decorated links) and the API client instance. |
| `userscript/src/CodebaseAPI.js`   | Client for the Codebase API Gateway.                  |
| `userscript/src/pages/`           | Plain DOM improvements for project, milestone, user and ticket pages. |
| `userscript/src/styles/`          | CSS, inlined into the built script. `Modern.css` is the GitHub inspired layer, `Icons.css` is generated. |
| `userscript/scripts/`             | `generate-icons.mjs` builds `Icons.css` from Octicons (`npm run icons`). |
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
