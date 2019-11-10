[![npm (scoped)](https://img.shields.io/npm/v/@ilg/cli-start-options.svg)](https://www.npmjs.com/package/@ilg/cli-start-options) 
[![license](https://img.shields.io/github/license/xpack/cli-start-options-js.svg)](https://github.com/xpack/cli-start-options-js/blob/xpack/LICENSE) 
[![Standard](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com/)
[![Travis](https://img.shields.io/travis/xpack/cli-start-options-js.svg?label=linux)](https://travis-ci.org/xpack/cli-start-options-js)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/rydiijfkxr11essq?svg=true)](https://ci.appveyor.com/project/ilg-ul/cli-start-options-js) 
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

The `.then()` callback is used mainly to make expclit that the `start()` is
a promise.

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
    cliOptions.addCommand(['build', 'b', 'bild'], 'lib/xmake/build.js')
    cliOptions.addCommand(['test', 't', 'tst'], 'lib/xmake/test.js')
    cliOptions.addCommand(['import'], 'lib/xmake/import.js')
    cliOptions.addCommand(['export'], 'lib/xmake/export.js')
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

## Developer info

### Git repo

```console
$ git clone https://github.com/xpack/cli-start-options-js.git cli-start-options-js.git
$ cd cli-start-options-js.git
$ npm install
$ sudo npm link 
$ ls -l /usr/local/lib/node_modules/@ilg
```

A link to the development folder should be present in the system
`node_modules` folder.

In projects that use this module under development, link back from the
global location:

```console
$ npm link @ilg/cli-start-options
```

### Tests

The tests use the [`node-tap`](http://www.node-tap.org) framework 
(_A Test-Anything-Protocol library for Node.js_, written by Isaac Schlueter).

As for any `npm` package, the standard way to run the project tests is via 
`npm test`:

```console
$ cd cli-start-options-js.git
$ npm install
$ npm run test
```

A typical test result looks like:

```console
$ npm run test

> @ilg/cli-start-options@0.6.0 test /Users/ilg/My Files/MacBookPro Projects/xPack/npm-modules/cli-start-options-js.git
> standard && npm run test-tap -s

test/tap/020-errors.js .............................. 18/18
test/tap/030-options-common.js .................... 154/154
test/tap/040-module-invocation.js ................... 30/30
test/tap/050-interactive.js ......................... 15/15
test/tap/060-cmd-copy.js ............................ 46/46
test/tap/070-author.js .............................. 10/10
total ............................................. 273/273

  273 passing (15s)

  ok
```

To run a specific test with more verbose output, use `npm run tap`:

```console
$ npm run tap test/tap/060-cmd-copy.js

> @ilg/cli-start-options@0.6.0 tap /Users/ilg/My Files/MacBookPro Projects/xPack/npm-modules/cli-start-options-js.git
> tap --reporter=spec --timeout 300 --no-color "test/tap/060-cmd-copy.js"


test/tap/060-cmd-copy.js
  xtest copy
    ✓ exit code is syntax
    ✓ has stdout
    ✓ has Usage
    ✓ has two errors
    ✓ has --file error
    ✓ has --output error

  xtest copy -h
    ✓ exit code is success
    ✓ has stdout
    ✓ has title
    ✓ has Usage
    ✓ has copy options
    ✓ has --file
    ✓ has --output
    ✓ stderr is empty

  xtest cop -h
    ✓ exit code is success
    ✓ has stdout
    ✓ has title
    ✓ has Usage
    ✓ stderr is empty

  xtest cop --file xxx --output yyy -q
    ✓ exit code is input
    ✓ stdout is empty
    ✓ stderr has 1 line
    ✓ stderr is ENOENT

  unpack
    ✓ cmd-code.tgz unpacked into /var/folders/n7/kxqjc5zs4qs0nb44v1l2r2j00000gn/T/xtest-copy
    ✓ chmod ro file
    ✓ mkdir folder
    ✓ chmod ro folder

  xtest cop --file input.json --output output.json
    ✓ exit code is success
    ✓ stdout has 5 lines
    ✓ stdout is completed
    ✓ stderr is empty
    ✓ content is read in
    ✓ json was parsed
    ✓ has name

  xtest cop --file input --output output -v
    ✓ exit code
    ✓ stdout has 6 lines
    ✓ stdout is completed
    ✓ stderr is empty

  xtest cop --file input --output ro/output -v
    ✓ exit code is output
    ✓ stdout has 4 lines
    ✓ up to writing
    ✓ stderr has 1 line
    ✓ stderr is EACCES

  cleanup
    ✓ chmod rw file
    ✓ chmod rw folder
    ✓ remove tmpdir


  46 passing (3s)
```

### Coverage tests

Coverage tests are a good indication on how much of the source files is 
exercised by the tests. Ideally all source files should be covered 100%, 
for all 4 criteria (statements, branches, functions, lines).

To run the coverage tests, use `npm run test-coverage`:

```console
$ npm run test-coverage

> @ilg/cli-start-options@0.1.15 test-coverage /Users/ilg/My Files/MacBookPro Projects/xPack/npm-modules/cli-start-options-js.git
> tap --coverage --reporter=classic --timeout 600 --no-color "test/tap/*.js"

test/tap/020-errors.js .............................. 18/18
test/tap/030-options-common.js .................... 154/154
test/tap/040-module-invocation.js ................... 30/30
test/tap/050-interactive.js ......................... 15/15
test/tap/060-cmd-copy.js ............................ 46/46
test/tap/070-author.js .............................. 10/10
total ............................................. 273/273

  273 passing (31s)

  ok
------------------------------|----------|----------|----------|----------|-------------------|
File                          |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
------------------------------|----------|----------|----------|----------|-------------------|
All files                     |    88.38 |    74.07 |    88.24 |    88.38 |                   |
 cli-start-options-js.git     |      100 |      100 |      100 |      100 |                   |
  index.js                    |      100 |      100 |      100 |      100 |                   |
 cli-start-options-js.git/lib |    88.11 |    74.07 |    88.24 |    88.11 |                   |
  cli-application.js          |    92.92 |    74.44 |    84.09 |    92.92 |... 27,728,730,910 |
  cli-command.js              |    98.91 |     87.8 |      100 |    98.91 |               163 |
  cli-error.js                |    88.46 |      100 |       50 |    88.46 |       149,170,187 |
  cli-help.js                 |    90.91 |       80 |       96 |    90.91 |... 54,156,157,258 |
  cli-options.js              |    89.39 |       80 |    92.86 |    89.39 |... 06,607,608,611 |
  cli-util.js                 |    92.86 |       50 |      100 |    92.86 |                84 |
  upgrade-checker.js          |    48.61 |    10.34 |       75 |    48.61 |... 72,175,176,178 |
------------------------------|----------|----------|----------|----------|-------------------|
```

It is also possible to get coverage while running a single test:

```console
$ npm run tap-coverage test/tap/021-dm-commands.js

> @ilg/cli-start-options@0.6.0 tap-coverage /Users/ilg/My Files/MacBookPro Projects/xPack/npm-modules/cli-start-options-js.git
> tap --coverage --reporter=spec --timeout 300 --no-color "test/tap/021-dm-commands.js"
...
```

#### Coverage exceptions

- none
  
### Continuous Integration (CI)

The continuous integration tests are performed via 
[Travis CI](https://travis-ci.org/xpack/cli-start-options-js) and 
[AppVeyor](https://ci.appveyor.com/project/ilg-ul/cli-start-options-js).

To speed up things, the `node_modules` folder is cached between builds.

### Standard compliance

The module uses ECMAScript 6 class definitions.

As style, it uses the [JavaScript Standard Style](https://standardjs.com/), 
automatically checked at each commit via Travis CI.

Known and accepted exceptions:

- `// eslint-disable-line node/no-deprecated-api` to continue using the 
deprecated `domain` module

To manually fix compliance with the style guide (where possible):

```console
$ npm run fix

> @ilg/cli-start-options@0.1.12 fix /Users/ilg/My Files/MacBookPro Projects/xPack/npm-modules/cli-start-options-js.git
> standard --fix

```

### Documentation metadata

The documentation metadata follows the [JSdoc](http://usejsdoc.org) tags.

To enforce checking at file level, add the following comments right after 
the `use strict`:

```javascript
'use strict'
/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */
```

Note: be sure C style comments are used, C++ styles are not parsed by 
[ESLint](http://eslint.org).

### How to publish

* `npm run fix`
* commit all changes
* `npm run test-coverage`
* update `CHANGELOG.md`; commit with a message like _CHANGELOG: prepare v0.1.2_
* `npm version patch` (bug fixes), `npm version minor` (compatible API 
  additions), `npm version major` (incompatible API changes)
* push all changes to GitHub; this should trigger CI
* wait for CI tests to complete
* `npm publish` (use `--access public` when publishing for the first time)

## License

The original content is released under the 
[MIT License](https://opensource.org/licenses/MIT), with all rights 
reserved to [Liviu Ionescu](https://github.com/ilg-ul).
