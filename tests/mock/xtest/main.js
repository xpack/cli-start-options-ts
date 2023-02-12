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

import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

import { CliApplication, CliOptions } from '../../../dist/index.js'

// ----------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ============================================================================

export class Xtest extends CliApplication {
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
  static doInitialise () {
    const Self = this

    // ------------------------------------------------------------------------
    // Mandatory, must be set here, not in the library, since it takes
    // the shortcut of using `__dirname` of the main file.
    Self.rootPath = __dirname

    // Enable -i|--interactive
    Self.hasInteractiveMode = true

    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.
    CliOptions.addCommand(['copy', 'c'], 'xtest/copy.js')
    CliOptions.addCommand(['notclass'], 'xtest/not-class.js')
    // Non existent.
    CliOptions.addCommand(['con'], 'xtest/con.js')
    CliOptions.addCommand(['verbosity', 'c'], 'xtest/verbosity.js')
    CliOptions.addCommand(['long'], 'xtest/long.js')
    CliOptions.addCommand(['many'], 'xtest/many.js')
    CliOptions.addCommand(['gen'], 'xtest/generator.js')
    CliOptions.addCommand(['unimpl'], 'xtest/unimpl.js')
    CliOptions.addCommand(['cwd'], 'xtest/cwd.js')

    // The common options were already initialised by the caller,
    // and are ok, no need to redefine them.
    CliOptions.addOptionGroups(
      [
        {
          title: 'Extra options',
          optionDefs: [
            {
              options: ['--extra', '--very-extra', '--very-long-extra'],
              msg: 'Extra options',
              action: (context) => {
                context.config.extra = true
              },
              init: (context) => {
                context.config.extra = false
              },
              doProcessEarly: true
            }
          ]
        }
      ])
  }

  // --------------------------------------------------------------------------

  // Constructor: use parent definition.
  // main(): use parent definition
  // help(): use parent definition.

  // (isn't object oriented code reuse great?)
}

// ----------------------------------------------------------------------------
