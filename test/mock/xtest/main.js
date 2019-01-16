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
 * The Xtest main module.
 *
 * It is re-exported publicly by `index.js`.
 *
 * To import classes from this module into Node.js applications, use:
 *
 * ```javascript
 * const Xtest = require('xtest').Xtest
 * ```
 */

// ----------------------------------------------------------------------------

// const path = require('path')

// ES6: `import { CliApplication, CliOptions } from 'cli-start-options'
const CliApplication = require('../../../index.js').CliApplication

// ============================================================================

// export
class Xtest extends CliApplication {
  // --------------------------------------------------------------------------

  /**
   * @summary Construct the application object.
   *
   * @param {Object} args The generic arguments object.
   *
   * @description
   * Initialise the options manager with application
   * specific commands and common options.
   */
  constructor (args) {
    super(args)

    // Mandatory, must be set here, not in the library, since it takes
    // the shortcut of using `__dirname` of the main file.
    this.rootAbsolutePath = __dirname

    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.
    const cliOptions = this.cliOptions

    cliOptions.addCommand(['copy', 'c'], 'xtest/copy.js')
    cliOptions.addCommand(['notclass'], 'xtest/not-class.js')
    // Non existent.
    cliOptions.addCommand(['con'], 'xtest/con.js')
    cliOptions.addCommand(['verbosity', 'c'], 'xtest/verbosity.js')
    cliOptions.addCommand(['long'], 'xtest/long.js')
    cliOptions.addCommand(['many'], 'xtest/many.js')
    cliOptions.addCommand(['gen'], 'xtest/generator.js')
    cliOptions.addCommand(['unimpl'], 'xtest/unimpl.js')
    cliOptions.addCommand(['cwd'], 'xtest/cwd.js')

    // The common options will be initialised right after these.
    cliOptions.addOptionGroups(
      [
        {
          title: 'Extra options',
          optionDefs: [
            {
              options: ['--extra', '--very-extra', '--very-long-extra'],
              message: 'Extra options',
              action: (context) => {
                context.config.extra = true
              },
              init: (context) => {
                context.config.extra = false
              }
            },
            {
              options: ['--early', '--very-early', '--very-long-early'],
              message: 'Early options',
              action: (context) => {
                context.config.early = true
              },
              init: (context) => {
                context.config.early = false
              },
              doProcessEarly: true
            }
          ]
        }
      ])
  }

  // --------------------------------------------------------------------------

  // main(): use parent definition
  // help(): use parent definition.

  // (isn't object oriented code reuse great?)
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The Xtest class is added as a property to this object.

module.exports.Xtest = Xtest

// In ES6, it would be:
// export class Xtest { ... }
// ...
// import { Xtest } from 'xtest.js'

// ----------------------------------------------------------------------------
