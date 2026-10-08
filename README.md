# Codebase Userscript

A userscript that decorates the [Codebase](https://www.codebasehq.com/) project management application.

This project is based on the [React userscript template](https://github.com/siefkenj/react-userscripts/)
by [Jason Siefken](https://github.com/siefkenj).

## Features

The userscript enhances various parts of the Codebase UI. At this stage the scope
of the changes are mainly concerning the ticket view.

### New ticket header

- Adds the ticket ID before the title
- Adds a copy ticket reference button next to the title for easy copy & past into
  time tracking entries
- Makes the header sticky
- Updates the styling of the status and priority fields

### New avatars

Users that have not uploaded an avatar gets a custom avatar with containing
the user initials and a color derived from the users company name.

### New sidebar

Replaces the right sidebar with a modern looking and information dense version
based on the Github issue sidebar.

- New styling of the **Milestone** property that does not use more space
  than needed.
- Adds a **Participants** list where all users who have participated in the
  ticket is listed with an avatar. Hoovering the avatar displays additional
  user information.
- Moves the hidden "Blockers" feature into plain sight and makes it accessible.
- Adds a new **Referenced tickets** list that lists all the tickets that
  are referenced in the current scope.
- Moves the **Tags** feature into the sidebar and adds the option to use themes
  tags using tag name prefixes (`branch:`, `alert:` available right now).
- Adds the property **Branch** that displayes the ticket associated branch
  name. This is based on the existance of a tag named `branch:1023-branch-name`.
- Improves the **Watcher** functionality by adding a easy to use **Notifications**
  component to the sidebar where a user can easily subscribe/unsubscribe from
  ticket notifications.

### Decorated ticket links

Ticket links are decorated with additional information

### Ticket page extras

- **Copy ticket link**: Copies the ticket as a Markdown link, `[#123 Subject](url)`.
- **Last comment**: A header button that scrolls the latest comment into view.
- **Comments with tasks**: Comments containing task lists are highlighted.

### Project pages

- **Project search**: The header search is scoped to the current project.
- **Open tickets by default**: The ticket list menu link filters on `status:open`.

### User pages

Adds a list of the tickets worked on today, grouped by project, to the top of
the user activity feed. Handy for copying into a time tracker.

## Install

Vist [latest release](https://github.com/petertornstrand/codebase-harvest-userscript/releases/latest)
page and click on the file `codebase.user.js`. Your userscript manager
should pick up on the script and present you with an installation screen.


## Configuration

Once the script is installed, you need to add configuration to your userscript
manager. If you are using [Violentmonkey](https://violentmonkey.github.io/):

1. Open the dashboard and click on the _Edit_ button for the script
2. Click the _Values_ tab
3. Click the _Show/edit the entire value storage_ link
4. Paste the following JSON into the text area to the right:
   ```json
   {
      "cbapi_base_url": "<CBAPI_BASE_URL>",
      "cbapi_key": "<CBAPI_KEY>",
      "cb_key": "<CB_KEY>",
      "cb_username": "<CB_USERNAME>"
    }
   ```
   
The `<CBAPI_BASE_URL>` is the URL of the [Codebase API Gateway](https://github.com/petertornstrand/cbapi).
A separate project that this userscript uses to communicate with the Codebase
API.

## Development

To set up a development environment for this project, follow these instructions.

Clone the repository to your local file system:

```
git clone git@github.com:petertornstrand/codebase-userscript.git
cd codebase-userscript/userscript
```
  
Start the development environment using:

```
ddev start
```

Build and watch the script by executing:
```
ddev npm install
ddev npm run build:watch
```

Visit the URL https://codebase.ddev.site/codebase-dev.user.js and install the
userscript via your userscript manager.

## Testing

Tests use [Vitest](https://vitest.dev/) with jsdom. Run them from `userscript/`:

```
ddev npm test          # single run
ddev npm run test:watch  # re-run on change while developing
```

The tests run against Preact, like the build. The Codebase API is mocked, and
the Codebase page markup is represented by small fixtures in
`userscript/src/test/fixtures.js`. Update the fixtures if Codebase changes its
markup.
