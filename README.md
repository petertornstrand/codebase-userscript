# Codebase Harvest Integration Userscript

A userscript that adds [Harvest](https://www.getharvest.com/) integration to [Codebase](https://www.codebasehq.com/).

This project is based on the [React userscript template](https://github.com/siefkenj/react-userscripts/)
by [Jason Siefken](https://github.com/siefkenj).

## Install

Vist [latest release](https://github.com/petertornstrand/codebase-harvest-userscript/releases/latest)
page and click on the file `codebase-harvest.user.js`. Your userscript manager
should pick up on the script and present you with an installation screen.

Once the userscript is installed, you need to configure it via your userscript
managers UI. If you are using [Violentmonkey](https://violentmonkey.github.io/)
click the icon in the browser toolbar and then on the *cog* icon.

Find the userscript named *Codebase: Harvest* and click the *Edit* icon. Then
click the *Values* tab followed by *Show/edit the entire script value storage*
link.

Paste your *configuration* in the textarea to the right and click *OK*.

```json
{
  "harvest_access_token": "1234",
  "harvest_account_id": "1234",
  "harvest_user_agent": "HarvestApp (john.doe@doe.inc)",
  "<CODEBASE_PROJECT_ID>": "client_id=123&project_id=123"
}
```

The `<CODEBASE_PROJECT_ID>` is your Codebase projects *Permalink*. You can add
as many of these as you need. The contents of this variable should contain
matching `client_id` and `project_id` from your Harvest account.

## Development

To set up a development environment for this project, follow these instructions.

Clone the repository to your local file system:

```
git clone git@github.com:petertornstrand/codebase-harvest-userscript.git
cd codebase-harvest-userscript/userscript
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

Visit the URL https://codebase-harvest.ddev.site/codebase-harvest-dev.user.js
and install the userscript via your userscript manager.
