[![npm (scoped)](https://img.shields.io/npm/v/@ilg/cli-start-options.svg)](https://www.npmjs.com/package/@ilg/cli-start-options)
[![license](https://img.shields.io/github/license/xpack/cli-start-options-js.svg)](https://github.com/xpack/cli-start-options-js/blob/xpack/LICENSE)
[![Standard](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com/)
[![Travis](https://img.shields.io/travis/xpack/cli-start-options-js.svg?label=linux)](https://travis-ci.org/xpack/cli-start-options-js)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/rydiijfkxr11essq?svg=true)](https://ci.appveyor.com/project/ilg-ul/cli-start-options-js)
[![GitHub issues](https://img.shields.io/github/issues/xpack/cli-start-options-js.svg)](https://github.com/xpack/cli-start-options-js/issues)
[![GitHub pulls](https://img.shields.io/github/issues-pr/xpack/cli-start-options-js.svg)](https://github.com/xpack/cli-start-options-js/pulls)

## cli-startup-options-js - maintainer info

This page documents some of the operations required during module
development and maintenance.

For the user information, see the
[README](https://github.com/xpack/update-checker-js/blob/master/README.md) file.

### Git repo

```console
$ git clone https://github.com/xpack/cli-start-options-js.git cli-start-options-js.git
$ cd cli-start-options-js.git
$ npm install
$ npm link
$ ls -l ${HOME}/.nvm/versions/node/$(node --version)/lib/node_modules/@ilg
```

A link to the development folder should be present in the
`node_modules` folder.

In projects that use this module under development, link back from the
global location:

```console
$ cd <project-folder>
$ npm link @ilg/cli-start-options
$ ls -l node_modules/@ilg
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

Note: the test related files are not present on the published package,
and to access them it is necessary to use the development repository.

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

The tests are currently performed with node 10, 12.

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

- `npm run fix`
- commit all changes
- `npm run test-coverage`
- update `CHANGELOG.md`; commit with a message like _CHANGELOG: prepare v0.1.2_
- `npm version patch` (bug fixes), `npm version minor` (compatible API
  additions), `npm version major` (incompatible API changes)
- push all changes to GitHub; this should trigger CI
- wait for CI tests to complete
- `npm publish` (use `--access public` when publishing for the first time)
