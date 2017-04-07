/*
 * This file is part of the xPack distribution
 *   (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom
 * the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict'
// eslint valid-jsdoc: "error"

// ----------------------------------------------------------------------------

/**
 * This is the module entry point, the file that is processed when
 * `require('<module>')` is called.
 *
 * For this to work, it must be linked from `package.json` as
 * `"main": "./index.js",`, which is, BTW, the default behaviour.
 *
 * To import classes from this module into Node.js applications, use:
 *
 * ```javascript
 * const CliOptions = require('@ilg/cli-start-options').CliOptions
 * const CliCmd = require('./lib/cli-cmd.js').CliCmd
 * const CliHelp = require('./lib/cli-help.js').CliHelp
 * const CliOptions = require('./lib/cli-options.js').CliOptions
 * ```
 */

// ES6: `import { CliApp } from './lib/cli-app.js'
const CliApp = require('./lib/cli-app.js').CliApp

// ES6: `import { CliCmd } from './lib/cli-cmd.js'
const CliCmd = require('./lib/cli-cmd.js').CliCmd

// ES6: `import { CliHelp } from './lib/cli-help.js'
const CliHelp = require('./lib/cli-help.js').CliHelp

// ES6: `import { CliOptions } from './lib/cli-options.js'
const CliOptions = require('./lib/cli-options.js').CliOptions

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The Main class is added as a property with the same name to this object.

module.exports.CliApp = CliApp
module.exports.CliCmd = CliCmd
module.exports.CliHelp = CliHelp
module.exports.CliOptions = CliOptions

// In ES6, it would be:
// export class CliApp { ... }
// ...
// import { CliApp, CliCmd, CliHelp, CliOptions } from 'cli-start-options.js'

// ----------------------------------------------------------------------------
