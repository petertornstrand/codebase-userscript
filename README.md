# Codebase Userscript

A userscript that decorates the [Codebase](https://www.codebasehq.com/) project management application.

This project is based on the [React userscript template](https://github.com/siefkenj/react-userscripts/)
by [Jason Siefken](https://github.com/siefkenj).

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
