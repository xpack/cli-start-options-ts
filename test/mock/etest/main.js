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
 * The Etest main module.
 *
 * It is re-exported publicly by `index.js`.
 *
 * To import classes from this module into Node.js applications, use:
 *
 * ```javascript
 * const Etest = require('Etest').Etest
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
class Etest extends CliApplication {
  // --------------------------------------------------------------------------

  constructor (params) {
    super(params)

    // Mandatory, must be set here, not in the library, since it takes
    // the shortcut of using `__dirname` of the main file.
    this.rootAbsolutePath = __dirname

    this.cliOptions.addOptionsGroups(
      [
        {
          title: 'Etest options',
          insertInFront: true,
          postOptions: '[<targets>...]',
          optionsDefs: [
            {
              options: ['-t', '--tool'],
              param: 'name',
              message: 'Subtool name',
              init: (object) => {
                object.config.toolName = undefined
              },
              action: (object, val) => {
                object.config.toolName = val.toLowerCase()
              },
              hasValue: true,
              values: ['clean'],
              isOptional: true
            },
            {
              options: ['-n', '--dry-run'],
              message: 'Only display, do not run commands',
              init: (object) => {
                object.config.isDryRun = false
              },
              action: (object, val) => {
                object.config.isDryRun = true
              },
              isOptional: true
            }
          ]
        }
      ]
    )
  }

  // --------------------------------------------------------------------------

  // main(): use parent definition
  // help(): use parent definition.

  // --------------------------------------------------------------------------

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

    log.info(this.helpTitle)

    this.outputDoneDuration()
    return CliExitCodes.SUCCESS
  }

  // --------------------------------------------------------------------------
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The Etest class is added as a property to this object.

module.exports.Etest = Etest

// In ES6, it would be:
// export class Etest { ... }
// ...
// import { Etest } from 'Etest.js'

// ----------------------------------------------------------------------------
