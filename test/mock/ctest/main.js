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
/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/**
 * The Ctest main module.
 *
 * It is re-exported publicly by `index.js`.
 *
 * To import classes from this module into Node.js applications, use:
 *
 * ```javascript
 * const Ctest = require('ctest').Ctest
 * ```
 */

// ----------------------------------------------------------------------------

// const path = require('path')

// ES6: `import { CliApplication, CliOptions } from 'cli-start-options'
const CliApplication = require('../../../index.js').CliApplication
// const CliOptions = require('../../../index.js').CliOptions
const CliExitCodes = require('../../../index.js').CliExitCodes

// ============================================================================

// export
class Ctest extends CliApplication {
  // --------------------------------------------------------------------------

  /**
   * @summary Initialise the application class object.
   *
   * @returns {undefined} Nothing.
   *
   * @description
   * Initialise the options manager with application
   * specific commands and common options.
   *
   * @override
   */
  static doInitialize () {
    const Self = this

    // ------------------------------------------------------------------------
    // Mandatory, must be set here, not in the library, since it takes
    // the shortcut of using `__dirname` of the main file.
    Self.rootPath = __dirname
  }

  // --------------------------------------------------------------------------

  constructor (args) {
    super(args)

    args.context.rootPath = __dirname
    this.optionGroups = [
      {
        title: 'Ctest options',
        postOptions: '[<targets>...]',
        optionDefs: [
          {
            options: ['-t', '--tool'],
            param: 'name',
            message: 'Subtool name',
            init: (context) => {
              context.config.toolName = undefined
            },
            action: (context, val) => {
              context.config.toolName = val.toLowerCase()
            },
            hasValue: true,
            values: [ 'clean' ],
            isOptional: true
          },
          {
            options: ['-n', '--dry-run'],
            message: 'Only display, do not run commands',
            init: (context) => {
              context.config.isDryRun = false
            },
            action: (context, val) => {
              context.config.isDryRun = true
            },
            isOptional: true
          }
        ]
      }
    ]
  }

  // main(): use parent definition
  // help(): use parent definition.

  /**
   * @summary Execute the `build` command.
   *
   * @param {string[]} argv Command line arguments.
   * @returns {number} Return code.
   *
   * @override
   */
  async doRun (argv) {
    const log = this.log
    log.trace(`${this.constructor.name}.doRun(${argv})`)

    log.info(this.title)

    this.outputDoneDuration()
    return CliExitCodes.SUCCESS
  }

  // --------------------------------------------------------------------------
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The Ctest class is added as a property to this object.

module.exports.Ctest = Ctest

// In ES6, it would be:
// export class Ctest { ... }
// ...
// import { Ctest } from 'ctest.js'

// ----------------------------------------------------------------------------
