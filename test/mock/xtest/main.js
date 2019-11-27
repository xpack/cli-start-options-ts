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
   * @param {Object} params The generic parameters object.
   *
   * @description
   * Initialise the options manager with application
   * specific commands and common options.
   */
  constructor (params) {
    super(params)

    const log = this.log

    // Mandatory, must be set here, not in the library, since it takes
    // the shortcut of using `__dirname` of the main file.
    this.rootAbsolutePath = __dirname

    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.

    const commands = {
      copy: {
        aliases: ['c'],
        modulePath: 'xtest/copy.js',
        helpOptions: {
          title: 'Copy a file to another file'
        }
      },
      notclass: {
        modulePath: 'xtest/not-class.js'
      },
      con: {
        modulePath: 'xtest/con.js'
      },
      verbosity: {
        aliases: ['vb'],
        modulePath: 'xtest/verbosity.js',
        helpOptions: {
          title: 'Exercise verbosity'
        }
      },
      long: {
        modulePath: 'xtest/long.js',
        helpOptions: {
          title: 'Test long options',
          usageMoreOptions:
            '[<name>...] [-- <very-long-long-long-params>...]'
        }
      },
      many: {
        modulePath: 'xtest/many.js',
        helpOptions: {
          title: 'Test many options'
        }
      },
      gen: {
        modulePath: 'xtest/generator.js',
        helpOptions: {
          title: 'Test generator options'
        }
      },
      unimpl: {
        modulePath: 'xtest/unimpl.js',
        helpOptions: {
          title: 'Test unimpl options'
        }
      },
      cwd: {
        modulePath: 'xtest/cwd.js',
        helpOptions: {
          title: 'CWD options'
        }
      },
      multi: {
        modulePath: 'xtest/multi.js',
        className: 'Multi',
        helpOptions: {
          title: 'Multiple subcommands'
        },
        subCommands: {
          first: {
            modulePath: 'xtest/multi.js',
            className: 'MultiFirst',
            helpOptions: {
              title: 'Multiple first'
            }
          },
          second: {
            modulePath: 'xtest/multi.js',
            className: 'MultiSecond',
            helpOptions: {
              title: 'Multiple second'
            }
          }
        }
      },
      noopts: {
        modulePath: 'xtest/noopts.js',
        helpOptions: {
          title: 'No options'
        }
      }
    }
    this.cmdsTree.addCommands(commands)
    log.trace(this.cmdsTree.getCommandsNames())

    // The common options will be initialised right after these.
    this.cliOptions.addOptionsGroups(
      [
        {
          title: 'Extra options',
          optionsDefs: [
            {
              options: ['--extra', '--very-extra', '--very-long-extra'],
              message: 'Extra options',
              init: ({ config }) => {
                config.extra = false
              },
              action: ({ config }) => {
                config.extra = true
              }
            },
            {
              options: ['--early', '--very-early', '--very-long-early'],
              message: 'Early options',
              init: ({ config }) => {
                config.early = false
              },
              action: ({ config }) => {
                config.early = true
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
