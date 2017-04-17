[![npm (scoped)](https://img.shields.io/npm/v/@ilg/cli-start-options.svg)](https://www.npmjs.com/package/@ilg/cli-start-options) 
[![license](https://img.shields.io/github/license/xpack/cli-start-options-js.svg)](https://github.com/xpack/cli-start-options-js/blob/xpack/LICENSE) 
[![Standard](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com/)
[![Travis](https://img.shields.io/travis/xpack/cli-start-options-js.svg?label=linux)](https://travis-ci.org/xpack/cli-start-options-js)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/rydiijfkxr11essq?svg=true)](https://ci.appveyor.com/project/ilg-ul/cli-start-options-js)

## CLI startup and options processing

A Node.js module with classes to implement a command line Node.js application.

The module exports several classes (like CliApplication, CliCommand, ...) that can be used as base classes for CLI applications.

## Prerequisites

A recent [Node.js](https://nodejs.org) (>7.x), since the ECMAScript 6 class syntax is used.

If this is the first time you hear about Node.js, download and install the the binaries specific for your platform without any concerns, they're just fine. 

## Easy install

The module is available as [**@ilg/cli-start-options**](https://www.npmjs.com/package/@ilg/cli-start-options) from the public repository, use `npm` to install it inside the module where it is needed:

```bash
$ npm install @ilg/clis-start-options --save
```

The module does not provide any executables, and generaly there are few reasons to install it globally.

The development repository is available from the GitHub [xpack/cli-start-options-js](https://github.com/xpack/cli-start-options-js) project.

## User info

The module can be included in CLI applications and the classes can be used to derive application classes.

```javascript
// Equivalent of import { CliApplication, CliCommand, CliHelp, CliOptions } from 'cli-start-options'

const CliApplication = require('@ilg/cli-start-options').CliApplication
const CliCommand = require('@ilg/cli-start-options').CliCommand
const CliHelp = require('@ilg/cli-start-options').CliHelp
const CliOptions = require('@ilg/cli-start-options').CliOptions
const CliOptions = require('@ilg/cli-start-options').CliOptions
const CliError = require('@ilg/cli-start-options').CliError
const CliErrorSyntax = require('@ilg/cli-start-options').CliErrorSyntax
const CliErrorApplication = require('@ilg/cli-start-options').CliErrorApplication
const CliExitCodes = require('@ilg/cli-start-options').CliExitCodes
```

## Developer info

### Git repo

```bash
$ git clone https://github.com/xpack/cli-start-options-js.git cli-start-options-js.git
$ cd cli-start-options-js.git
$ npm install
$ sudo npm link 
$ ls -l /usr/local/lib/node_modules/@ilg
```

A link to the development folder should be present in the system `node_modules` folder.

In projects that use this module under development, link back from the global location:

```bash
$ npm link @ilg/cli-start-options
```

### Tests

The tests use the [`node-tap`](http://www.node-tap.org) framework (_A Test-Anything-Protocol library for Node.js_, written by Isaac Schlueter).

As for any `npm` package, the standard way to run the project tests is via `npm test`:

```bash
$ cd cli-start-options-js.git
$ npm install
$ npm test
```

A typical test result looks like:

```
$ npm run test

> @ilg/cli-start-options@0.1.12 test /Users/ilg/My Files/MacBookPro Projects/xPack/npm-modules/cli-start-options-js.git
> standard && npm run test-tap -s

test/tap/cmd-copy.js ................................ 40/40
test/tap/interactive.js ............................. 14/14
test/tap/module-invocation.js ......................... 9/9
test/tap/options-common.js .......................... 24/24
total ............................................... 87/87

  87 passing (4s)

  ok
```

To run a specific test with more verbose output, use `npm run tap`:

```
$ npm run tap test/tap/cmd-copy.js -s

test/tap/cmd-copy.js
  xtest copy
    ✓ exit code
    ✓ has two errors
    ✓ has --file error
    ✓ has --output error
    ✓ has Usage

  xtest copy -h
    ✓ exit code
    ✓ has enough output
    ✓ has title
    ✓ has Usage
    ✓ has copy options
    ✓ has --file
    ✓ has --output
    ✓ stderr empty

  xtest co -h
    ✓ exit code
    ✓ has enough output
    ✓ has title
    ✓ has Usage
    ✓ stderr empty

  xtest co --file xxx --output yyy
    ✓ exit code
    ✓ stdout empty
    ✓ ENOENT

  unpack
    ✓ cmd-code.tgz unpacked into /var/folders/n7/kxqjc5zs4qs0nb44v1l2r2j00000gn/T/xtest-copy
    ✓ chmod
    ✓ mkdir ro
    ✓ chmod ro

  xtest co --file input.json --output output.json
    ✓ exit code
    ✓ no output
    ✓ no errors
    ✓ read in
    ✓ json parsed
    ✓ has name

  xtest co --file input.svd --output output.json -v
    ✓ exit code
    ✓ done message
    ✓ no errors

  xtest co --file input.svd --output ro/output.json -v
    ✓ exit code
    ✓ up to writing
    ✓ EACCES

  cleanup
    ✓ chmod
    ✓ chmod ro
    ✓ tmpdir removed


  40 passing (2s)
```

### Coverage tests

Coverage tests are a good indication on how much of the source files is exercised by the tests. Ideally all source files should be covered 100%, for all 4 criteria (statements, branches, functions, lines).

To run the coverage tests, use `npm run test-coverage`:

```
$ npm run test-coverage

> @ilg/cli-start-options@0.1.12 test-coverage /Users/ilg/My Files/MacBookPro Projects/xPack/npm-modules/cli-start-options-js.git
> tap --coverage --reporter=classic --timeout 600 "test/tap/*.js"

test/tap/cmd-copy.js ................................ 40/40
test/tap/interactive.js ............................. 14/14
test/tap/module-invocation.js ......................... 9/9
test/tap/options-common.js .......................... 24/24
total ............................................... 87/87

  87 passing (9s)

  ok
------------------------------------|----------|----------|----------|----------|----------------|
File                                |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------------------------|----------|----------|----------|----------|----------------|
All files                           |    82.95 |    63.01 |    82.93 |    82.95 |                |
 cli-start-options-js.git           |      100 |      100 |      100 |      100 |                |
  index.js                          |      100 |      100 |      100 |      100 |                |
 cli-start-options-js.git/lib       |    84.28 |    65.54 |    86.61 |    84.28 |                |
  cli-application.js                |     83.7 |    63.64 |    76.09 |     83.7 |... 822,823,866 |
  cli-command.js                    |    74.58 |    57.14 |    77.78 |    74.58 |... 199,201,203 |
  cli-error.js                      |    94.12 |        0 |    66.67 |    94.12 |            118 |
  cli-help.js                       |    84.43 |    65.35 |      100 |    84.43 |... 283,284,326 |
  cli-logger.js                     |    80.77 |    45.45 |       90 |    80.77 |... 114,126,138 |
  cli-options.js                    |    88.24 |    77.78 |      100 |    88.24 |... 403,466,489 |
 cli-start-options-js.git/lib/utils |    51.43 |       36 |    45.45 |    51.43 |                |
  asy.js                            |    51.43 |       36 |    45.45 |    51.43 |... 122,137,147 |
------------------------------------|----------|----------|----------|----------|----------------|
```

### Continuous Integration (CI)

The continuous integration tests are performed via [Travis CI](https://travis-ci.org/xpack/cli-start-options-js) and [AppVeyor](https://ci.appveyor.com/project/ilg-ul/cli-start-options-js).


### Standard compliance

The module uses ECMAScript 6 class definitions.

As style, it uses the [JavaScript Standard Style](https://standardjs.com/), automatically checked at each commit via Travis CI.

Known and accepted exceptions:

- `// eslint-disable-line node/no-deprecated-api` to continue using the deprecated `domain` module

To manually fix compliance with the style guide (where possible):

```
$ npm run fix

> @ilg/cli-start-options@0.1.12 fix /Users/ilg/My Files/MacBookPro Projects/xPack/npm-modules/cli-start-options-js.git
> standard --fix

```

### Documentation metadata

The documentation metadata follows the [JSdoc](http://usejsdoc.org) tags.

To enforce checking at file level, add the following comments right after the `use strict`:

```
'use strict'
/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */
```

Note: be sure C style comments are used, C++ styles are not parsed by [ESLint](http://eslint.org).

## License

The original content is released under the MIT License, with
all rights reserved to Liviu Ionescu.
