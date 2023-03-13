[![GitHub package.json version](https://img.shields.io/github/package-json/v/xpack/cli-start-options-ts)](https://github.com/xpack/cli-start-options-ts/blob/mater/package.json)
[![npm (scoped)](https://img.shields.io/npm/v/@xpack/cli-start-options.svg)](https://www.npmjs.com/package/@xpack/cli-start-options/)
[![license](https://img.shields.io/github/license/xpack/cli-start-options-ts.svg)](https://github.com/xpack/cli-start-options-ts/blob/xpack/LICENSE)
[![TS-Standard - TypeScript Standard Style Guide](https://badgen.net/badge/code%20style/ts-standard/blue?icon=typescript)](https://github.com/standard/ts-standard/)
[![Actions Status](https://github.com/xpack/cli-start-options-ts/workflows/CI%20on%20Push/badge.svg)](https://github.com/xpack/cli-start-options-ts/actions)
[![GitHub issues](https://img.shields.io/github/issues/xpack/cli-start-options-ts.svg)](https://github.com/xpack/cli-start-options-ts/issues)
[![GitHub pulls](https://img.shields.io/github/issues-pr/xpack/cli-start-options-ts.svg)](https://github.com/xpack/cli-start-options-ts/pulls/)

# Maintainer & developer info

## Project repository

The project is hosted on GitHub:

- <https://github.com/xpack/cli-start-options-ts.git>

The project uses two branches:

- `master`, with the latest stable version (default)
- `develop`, with the current development version

To clone the `master` branch, use:

```sh
mkdir ${HOME}/Work/npm-modules && cd ${HOME}/Work/npm-modules
git clone \
https://github.com/xpack/cli-start-options-ts.git cli-start-options-ts.git
```

For development, to clone the `develop` branch, use:

```sh
git clone --branch develop \
https://github.com/xpack/cli-start-options-ts.git cli-start-options-ts.git
```

## Prerequisites

The prerequisites are:

- node >= 16.0.0
- npm

To ensure compatibility with older node, revert to an older one:

```sh
nvm use --lts 16
code
```

## Satisfy dependencies

```sh
npm install
```

## Add links for development

```sh
cd cli-start-options-ts.git
npm link
```

And in the projects referring it:

```sh
npm link @xpack/cli-start-options
```

## Start the compile background task

The TypeScript compiler can automatically recompile modified files. For
this, start it in `watch` mode.

```sh
npm run compile-watch
```

## Language standard compliance

The current version is TypeScript 4:

- <https://www.typescriptlang.org>
- <https://www.typescriptlang.org/docs/handbook>

The compiler is configured to produce `es2020` & `node16` files,
which means ECMAScript6 with Node.js modules, that can be imported
by any other ES6 project via `import`.

For more details on how to configure `tsconfig.json`, please see:

- <https://www.typescriptlang.org/tsconfig/>

## Standard style

As style, the project uses `ts-standard`, the TypeScript variant of
[Standard Style](https://standardjs.com/#typescript),
automatically checked at each commit via CI.

If necessary the syntax for exceptions is:

```js
// eslint-disable-next-line @typescript-eslint/no-xxx-yyy
```

The known rules are documented in the
[typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/docs/rules)
project.

Generally, to fit two editor windows side by side in a screen,
all files should limit the line length to 80.

```js
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */
```

Known and accepted exceptions:

- none

To manually fix compliance with the style guide (where possible):

```console
% npm run fix

> @xpack/cli-start-options@0.10.0 fix
> ts-standard --fix src tests
...
```

## Documentation metadata

The documentation metadata uses the
[TypeDoc](https://typedoc.org/guides/doccomments/) tags, without
explicit types, since they are provided by TypeScript.

## Tests

The tests use the [`node-tap`](http://www.node-tap.org) framework
(_A Test-Anything-Protocol library for Node.js_, written by Isaac Schlueter).

Tests can be written in TypeScript, assuming `ts-node` is also installed
(<https://node-tap.org/docs/using-with/#using-tap-with-typescript>)

As for any `npm` package, the standard way to run the project tests is via
`npm run test`:

```sh
cd cli-start-options-ts.git
npm install
npm run test
```

A full test run, including coverage, looks like:

```console
% npm run test-100-c8

> @xpack/cli-start-options@0.10.0-pre pretest-100-c8
> npm run compile && npm run lint


> @xpack/cli-start-options@0.10.0-pre compile
> tsc --build --verbose src tests

[10:13:41 PM] Projects in this build:
    * src/tsconfig.json
    * tests/tsconfig.json

[10:13:41 PM] Project 'src/tsconfig.json' is out of date because output 'esm/index.js' is older than input 'src/lib/cli-options.ts'

[10:13:41 PM] Building project '/Users/ilg/My Files/WKS Projects/xpack.github/npm-modules/cli-start-options-ts.git/src/tsconfig.json'...

[10:13:42 PM] Project 'tests/tsconfig.json' is out of date because output 'tests/mock/common.js' is older than input 'tests/mock/xtest/src/xtest/verbosity.ts'

[10:13:42 PM] Building project '/Users/ilg/My Files/WKS Projects/xpack.github/npm-modules/cli-start-options-ts.git/tests/tsconfig.json'...


> @xpack/cli-start-options@0.10.0-pre lint
> ts-standard src tests


> @xpack/cli-start-options@0.10.0-pre test-100-c8
> npm run test-tap-coverage-100-c8 -s

(node:765) ExperimentalWarning: Custom ESM Loaders is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:768) ExperimentalWarning: Custom ESM Loaders is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:767) ExperimentalWarning: Custom ESM Loaders is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:769) ExperimentalWarning: Custom ESM Loaders is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:770) ExperimentalWarning: Custom ESM Loaders is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
tests/tap/020-errors.ts ............................. 18/18
tests/tap/030-options-common.ts ................... 110/110
tests/tap/040-module-invocation.ts .................... 3/3
tests/tap/060-cmd-copy.ts ........................... 21/21
tests/tap/070-author.ts ............................. 12/12
total ............................................. 164/164

  164 passing (13s)

  ok
-----------------------|---------|----------|---------|---------|------------------------------------------------------------------------------------------------------------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------|---------|----------|---------|---------|------------------------------------------------------------------------------------------------------------------------
All files              |   88.08 |    86.85 |    83.9 |   88.08 |
 src                   |     100 |      100 |     100 |     100 |
  index.ts             |     100 |      100 |     100 |     100 |
 src/lib               |   87.86 |    86.85 |    83.9 |   87.86 |
  cli-application.ts   |   74.33 |    78.35 |    82.5 |   74.33 | ...9-491,572-577,582-585,590-591,608-718,739-766,814-833,849-857,860-925,962-964,991-993,1006-1009,1055-1066,1121-1123
  cli-command.ts       |   91.14 |    76.19 |   77.77 |   91.14 | 121-123,133-134,143-147,226-230,237-246,262-263
  cli-configuration.ts |     100 |      100 |     100 |     100 |
  cli-context.ts       |     100 |    33.33 |     100 |     100 | 99-102
  cli-error.ts         |   96.42 |      100 |      50 |   96.42 | 128-129,148-149,164-165
  cli-help.ts          |   99.52 |    96.03 |     100 |   99.52 | 131-132
  cli-options.ts       |   96.27 |    89.53 |    87.5 |   96.27 | 289-293,597-598,643-647,670-671,684-695
-----------------------|---------|----------|---------|---------|------------------------------------------------------------------------------------------------------------------------```

To run a specific test with more verbose output, use `npm run tap`:

```console
% npm run tap tests/tap/060-cmd-copy.ts -s

(node:900) ExperimentalWarning: Custom ESM Loaders is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
tests/tap/060-cmd-copy.ts
  xtest copy
    ✓ exit code is syntax
    ✓ has two errors
    ✓ has --file error
    ✓ has --output error
    ✓ has Usage

  xtest copy -h
    ✓ exit code is success
    ✓ has enough output
    ✓ has title
    ✓ has Usage
    ✓ has copy options
    ✓ has --file
    ✓ has --output
    ✓ stderr is empty

  xtest cop -h
    ✓ exit code is success
    ✓ has enough output
    ✓ has title
    ✓ has Usage
    ✓ stderr is empty

  xtest cop --file xxx --output yyy -q
    ✓ exit code is input
    ✓ stdout is empty
    ✓ strerr is ENOENT


  21 passing (3s)
```

### Coverage tests

Coverage tests are a good indication on how much of the source files is
exercised by the tests. Ideally all source files should be covered 100%,
for all 4 criteria (statements, branches, functions, lines).

Thus, passing coverage tests was enforced for all tests, as seen before.

#### Coverage exceptions

Exclusions are marked with `/* istanbul ignore next */` for
[istanbul](https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md)
and `/* c8 ignore start */` `/* c8 ignore stop */` for
[c8](https://github.com/bcoe/c8).

- TODO

### Continuous Integration (CI)

The continuous integration tests are performed via GitHub
[Actions](https://github.com/xpack/cli-start-options-ts/actions) on Ubuntu,
Windows and macOS, using node 16, 18.

## How to make new releases

### Release schedule

There are no fixed releases.

### Check Git

In the `xpack/cli-start-options-ts` Git repo:

- switch to the `develop` branch
- if needed, merge the `master` branch

No need to add a tag here, it'll be added when the release is created.

### Update npm packages

- `npm outdated`
- `npm update` or edit and `npm install`
- repeat and possibly manually edit `package.json` until everything is
  up to date
- commit the changes

Keep:

- [`@types/node`](https://www.npmjs.com/package/@types/node?activeTab=versions)
  locked to the oldest supported node (^16.18.14)
  [release](https://nodejs.org/download/release/) available for TypeScript.

### Determine the next version

As required by npm modules, this one also uses [semver](https://semver.org).

Determine the next version (like `0.10.0`),
and eventually update the
`package.json` file; the format is `0.10.0-pre`.

### Fix possible open issues

Check GitHub issues and pull requests:

- <https://github.com/xpack/cli-start-options-ts/issues/>

### Update `README-MAINTAINER.md`

Update the `README-MAINTAINER.md` file to reflect the changes
related to the new version.

## Update `CHANGELOG.md`

- check the latest commits `npm run git-log`
- open the `CHANGELOG.md` file
- check if all previous fixed issues are in
- add a line _* v0.10.0 released_
- commit with a message like _prepare v0.10.0_

## Prepare to publish

- terminate all running tasks (**Terminal** → **Terminate Task...**)
- select the `develop` branch
- commit everything
- `npm run fix`
- in the develop branch, commit all changes
- `npm run test`
- `npm run typedoc` and open the `docs/index.html` in a browser
- `npm run pack`; check the list of packaged files, possibly
  update `.npmignore`
- `npm version patch` (bug fixes), `npm version minor` (compatible API
  additions), `npm version major` (incompatible API changes)
- push all changes to GitHub;
- the `postversion` npm script should also update tags via
  `git push origin --tags`; this should trigger CI
- **wait for CI tests to complete**
- check <https://github.com/xpack/cli-start-options-ts/actions/>

## Publish to npmjs.com

- `npm publish --tag next` (use `--access public` when publishing for the first time)

Check if the version is present at
[@xpack/cli-start-options Versions](https://www.npmjs.com/package/@xpack/cli-start-options?activeTab=versions).

### Test

Test it with:

```bash
npm install -global @xpack/cli-start-options@next
```

### Merge into `master`

In this Git repo:

- select the `master` branch
- merge `develop`
- push all branches

## Web site deployment

The documentation site is built with [TypeDoc](https://typedoc.org/) and
published in the project GitHub
[Pages](https://xpack.github.io/cli-start-options-ts).

The Web site deployment is performed automatically when pushing to the
master branch, by a dedicated workflow in GitHub
[Actions](https://github.com/xpack/cli-start-options-ts/actions/workflows/typedoc.yml).

### Tag the npm package as `latest`

When the release is considered stable, promote it as `latest`:

- `npm dist-tag ls @xpack/cli-start-options`
- `npm dist-tag add @xpack/cli-start-options@0.10.0 latest`
- `npm dist-tag ls @xpack/cli-start-options`

## Useful links

- <https://www.typescriptlang.org/docs/>
- <https://www.typescriptlang.org/tsconfig/>
- <https://typedoc.org>, <https://typedoc.org/guides/doccomments/>
- <https://tsdoc.org>
- <https://jsdoc.app/index.html>
- <https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1>
