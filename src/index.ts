/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/MIT/.
 */

/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/**
 * This is the module entry point, the file that is processed when
 * `require('@ilg/cli-start-options')` is called.
 *
 * For this to work, it must be linked from `package.json` as
 * `"main": "./index.js",`, which is, BTW, the default behaviour.
 *
 * This file does not define the classes itself, but imports them
 * from various implementation files, and re-exports them.
 *
 * To import classes from this module into ES6 Node.js applications, use:
 *
 * ```javascript
 * import { CliOptions, CliCommand } from '@ilg/cli-start-options'
 * ```
 *
 * or, for CommonJS Node.js applications:
 *
 * ```javascript
 * const { CliOptions, CliCommand } = require('@ilg/cli-start-options')
 * ```
 */

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// For consistency, re-export all Logger definitions.
// Applications should not add @xpack/logger as an explicit dependency,
// but use it from here.
export * from '@xpack/logger'

// ----------------------------------------------------------------------------

// Re-export all local definitions.
export * from './lib/cli-application.js'
export * from './lib/cli-command.js'
export * from './lib/cli-context.js'
export * from './lib/cli-error.js'
export * from './lib/cli-help.js'
export * from './lib/cli-options.js'

// ----------------------------------------------------------------------------
