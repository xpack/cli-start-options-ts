[![GitHub package.json version](https://img.shields.io/github/package-json/v/xpack/cli-start-options-ts)](https://github.com/xpack/cli-start-options-ts/blob/mater/package.json)
[![npm (scoped)](https://img.shields.io/npm/v/@xpack/cli-start-options.svg)](https://www.npmjs.com/package/@xpack/cli-start-options)
[![license](https://img.shields.io/github/license/xpack/cli-start-options-js.svg)](https://github.com/xpack/cli-start-options-js/blob/xpack/LICENSE)

## A Node.js ES6 module with CLI startup and options processing

This project provides a **TypeScript** Node.js **ES6** module with
classes to implement a command line Node.js application.

The module exports several classes (like CliApplication, CliCommand, ...)
that can be used as base classes for CLI applications.

The open source project is hosted on GitHub as
[xpack/cli-start-options-ts](https://github.com/xpack/cli-start-options-ts).

## Maintainer & developer info

This page documents how to use this module in an user application.
For maintainer information, see the separate
[README-MAINTAINER](https://github.com/xpack/cli-start-options-ts/blob/master/README-MAINTAINER.md)
page.

## Prerequisites

A recent [Node.js](https://nodejs.org) (>=16.0.0), since the TypeScript code
is compiled into ECMAScript 2020 code with ES6 modules.

## Install

The module is available as
[`@xpack/cli-start-options`](https://www.npmjs.com/package/@xpack/cli-start-options)
from the public [`npmjs`](https://www.npmjs.com) repository;
it can be added as a dependency to any TypeScript or JavaScript
project with `npm install`:

```console
npm install --save @xpack/cli-start-options@latest
```

The module does not provide any executables, and generally there are no
reasons to install it globally.

## User info

This section is intended for those who plan to use this module in their
own projects.

The `@xpack/cli-start-options` module can be imported into both TypeScript
and JavaScript ES6 Node.js code with:

```typescript
import * as cli from '@xpack/cli-start-options'
```

Note: as per the ES6 specs, importing ES6 modules in legacy
CommonJS modules is no longer possible.

TODO

### Reference

For more details on the available class definitions, including all methods,
accessors, properties, etc,
please see the TypeDoc
[reference pages](https://xpack.github.io/cli-start-options-ts).

## Known problems

- none

## Status

The `@xpack/cli-start-options` module is fully functional and stable.

The main client for this module is the `xpm` CLI application.

## Tests

The module is tested
with 100% coverage and CI tested on every push via GitHub
[Actions](https://github.com/xpack/cli-start-options-ts/actions).

## Change log - incompatible changes

According to [semver](https://semver.org) rules:

> Major version X (X.y.z | X > 0) MUST be incremented if any
backwards incompatible changes are introduced to the public API.

### v1.0.0

The project was migrated to TypeScript and the code is now compiled into
**ES6** modules, that can be consumed by both TypeScript and JavaScript
packages. The minimum node engine was updated to >16.0.0.

Other changes:

- TODO

## License

The original content is released under the
[MIT License](https://opensource.org/license/mit/),
with all rights reserved to
[Liviu Ionescu](https://github.com/ilg-ul).
