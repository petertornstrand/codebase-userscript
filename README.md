# Codebase Userscript

A userscript that decorates the [Codebase](https://www.codebasehq.com/) project management application.

This project is based on the [React userscript template](https://github.com/siefkenj/react-userscripts/)
by [Jason Siefken](https://github.com/siefkenj).

## Install

Vist [latest release](https://github.com/petertornstrand/codebase-harvest-userscript/releases/latest)
page and click on the file `codebase.user.js`. Your userscript manager
should pick up on the script and present you with an installation screen.


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
