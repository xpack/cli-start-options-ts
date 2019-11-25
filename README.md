[![npm (scoped)](https://img.shields.io/npm/v/@ilg/cli-start-options.svg)](https://www.npmjs.com/package/@ilg/cli-start-options)
[![license](https://img.shields.io/github/license/xpack/cli-start-options-js.svg)](https://github.com/xpack/cli-start-options-js/blob/xpack/LICENSE)
[![Standard](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com/)
[![Actions Status](https://github.com/xpack/cli-start-options-js/workflows/Node.js%20CI%20on%20Push/badge.svg)](https://github.com/xpack/cli-start-options-js/actions)
[![GitHub issues](https://img.shields.io/github/issues/xpack/cli-start-options-js.svg)](https://github.com/xpack/cli-start-options-js/issues)
[![GitHub pulls](https://img.shields.io/github/issues-pr/xpack/cli-start-options-js.svg)](https://github.com/xpack/cli-start-options-js/pulls)

## CLI startup and options processing framework

A Node.js module with an advanced framework used to implement a command
line Node.js application.

It support batch (single shot, one command per invocation),
interactive (one invocation that accepts a sequence of
commands) and server like operations (multiple instances in parallel).

The module exports several classes (like CliApplication, CliCommand, ...)
that can be used as base classes for CLI applications.

## Prerequisites

A recent [Node.js](https://nodejs.org) (>=8.x), since the ECMAScript 6 class
syntax is used.

## Easy install

The module is available as
[`@ilg/cli-start-options`](https://www.npmjs.com/package/@ilg/cli-start-options)
from the public repository, use `npm` to install it inside the module where
it is needed:

```console
$ npm install @ilg/cli-start-options --save
```

The module does not provide any executables, and generally there are few
reasons to install it globally.

The development repository is available from the GitHub
[xpack/cli-start-options-js](https://github.com/xpack/cli-start-options-js)
project.

## User info

The module can be included in CLI applications and the classes can be used
to derive application classes.

```javascript
const CliApplication = require('@ilg/cli-start-options').CliApplication
const CliCommand = require('@ilg/cli-start-options').CliCommand
const CliHelp = require('@ilg/cli-start-options').CliHelp
const CliOptions = require('@ilg/cli-start-options').CliOptions
const CliError = require('@ilg/cli-start-options').CliError
const CliErrorSyntax = require('@ilg/cli-start-options').CliErrorSyntax
const CliErrorApplication = require('@ilg/cli-start-options').CliErrorApplication
const CliExitCodes = require('@ilg/cli-start-options').CliExitCodes
```

### Simple use case

The traditional use case is when there is a single entry point, which
processes all command line options.

For example, the main file can be `/lib/main.js`:

```js
const path = require('path')

const CliApplication = require('@ilg/cli-start-options').CliApplication
const CliExitCodes = require('@ilg/cli-start-options').CliExitCodes

class Xyz extends CliApplication {
  constructor (params) {
    super(params)

    // ------------------------------------------------------------------------
    // Mandatory, must be set here, not in the library, since it takes
    // the shortcut of using `__dirname` of the main file.
    this.rootAbsolutePath = path.dirname(__dirname)
  }

  async doRun (argv) {
    const log = this.log
    log.trace(argv)

    // Implement the functionality.
    return CliExitCodes.SUCCESS
  }
}

module.exports.Main = Xyz
```

And it can be invoked from `/bin/xyz.js`:

```js
#!/usr/bin/env node
const Main = require('../lib/main.js').Main

Main.start().then()
```

The `.then()` callback is used mainly to make expclit that the `start()` 
function returns a promise.

Note: Generally do not call `process.exit()`, since this will abruptly
termintate the process and do not allow pending callbacks to run.

The framework implements a lot of functionality, like parsing logger level
options, displaying help, displaying version, etc.

An example of such an application with an empty `doMain()` behaves like this:

```console
$ xmk --help

The xPack Make command line tool
Usage: xmk  [<options> ...] [<params>...]

Common options:
  --loglevel <level>    Set log level (silent|warn|info|verbose|debug|trace)
  -s|--silent           Disable all messages (--loglevel silent)
  -q|--quiet            Mostly quiet, warnings and errors (--loglevel warn)
  --informative         Informative (--loglevel info)
  -v|--verbose          Verbose (--loglevel verbose)
  -d|--debug            Debug messages (--loglevel debug)
  -dd|--trace           Trace messages (--loglevel trace, -d -d)
  --no-update-notifier  Skip check for a more recent version
  -C <folder>           Set current folder

xmk -h|--help           Quick help
xmk --version           Show version

npm xmk@0.1.0 '/Users/ilg/My Files/MacBookPro Projects/xPack/npm-modules/xmk.git'
Home page: <https://github.com/xpack/xmk-js>
Bug reports: <https://github.com/xpack/xmk-js/issues>

$ xmk --version
0.1.0
```

The `argv` array has the parsed options
filtered out, only the remaining options are passed to `doRun()`.

### A more complex use case

If the tool implements multiple commands, the framework is able to
identify them and call the specific implementation directly, without any application code.

For this, in addition to the CliApplication class, there must be separate
CliCommand classes, for each command.

The commands must be registered to the framework in constructor;
for example the main file in `/lib/main.js` can read:

```js
const path = require('path')

const CliApplication = require('@ilg/cli-start-options').CliApplication
const CliExitCodes = require('@ilg/cli-start-options').CliExitCodes

class Xbld extends CliApplication {
  constructor (params) {
    super(params)

    // ------------------------------------------------------------------------
    // Mandatory, must be set here, not in the library, since it takes
    // the shortcut of using `__dirname` of the main file.
    this.rootAbsolutePath = path.dirname(__dirname)

    const cliOptions = this.cliOptions
    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.
    const commands = {
      install: {
        aliases: ['i'],
        modulePath: 'lib/xpm/install.js'
      },
      'run-script': {
        aliases: ['run', 'rum'],
        modulePath: 'lib/xpm/run-script.js'
      },
      build: {
        aliases: ['b', 'bild'],
        modulePath: 'lib/xpm/build.js'
      },
      init: {
        aliases: ['ini'],
        modulePath: 'lib/xpm/init.js'
      }
    }
    this.cmdsTree.addCommands(commands)

  }
}
```

### The command configuration

The framework can parse each command options, and leave the results
in a configuration object.

```js
/**
 * @typedef {Object} Config
 * @property {String} cwd The actual current working folder, from -C.
 * @property {Number} logLevel The actual log level.
 * @property {Boolean} isInteractive
 * @property {Boolean} invokedFromCli
 * @property {Boolean} isVersionRequest
 */

```

## Maintainer info

This page documents how to use this module in an user application.
For maintainer information, see the separate
[README-MAINTAINER](https://github.com/xpack/cli-start-options-js/blob/master/README-MAINTAINER.md)
page.

## License

The original content is released under the
[MIT License](https://opensource.org/licenses/MIT), with all rights
reserved to [Liviu Ionescu](https://github.com/ilg-ul).
