/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
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

import * as cli from '../../../../esm/index.js'

// ============================================================================

interface XtestConfig extends cli.Configuration {
  extra: boolean
}

export class Xtest extends cli.Application {
  // --------------------------------------------------------------------------

  constructor (params: cli.ApplicationConstructorParams) {
    super(params)

    const context: cli.Context = this.context

    // Mandatory, must be set here, not in the library, since it computes
    // the root path as relative to the path of this file..
    context.rootPath =
      path.dirname(path.dirname(fileURLToPath(import.meta.url)))

    // Enable REPL
    this.enableREPL = true

    // To enable server mode: --interactive-server-port 9999
    // or statically with:
    // staticThis.interactiveServerPort = 9999

    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.
    this.commandsTree.addCommands({
      copy: {
        aliases: ['c'],
        modulePath: 'src/xtest/copy.js',
        helpOptions: {
          title: 'Copy a file to another file'
        }
      },
      notclass: {
        modulePath: 'src/xtest/not-class.js'
      },
      con: {
        modulePath: 'src/xtest/con.js'
      },
      verbosity: {
        aliases: ['vb'],
        modulePath: 'src/xtest/verbosity.js',
        helpOptions: {
          title: 'Exercise verbosity'
        }
      },
      long: {
        modulePath: 'src/xtest/long.js',
        helpOptions: {
          title: 'Test long options',
          usagePreOptions: '[<name>...]', // Array of test names.
          usagePostOptions: '[-- <very-long-long-long-args>...]'
        },
        hasCustomOptions: true
      },
      many: {
        modulePath: 'src/xtest/many.js',
        helpOptions: {
          title: 'Test many options',
          usagePreOptions: '[<name1> <name2> <name3>...]'
        }
      },
      gen: {
        modulePath: 'src/xtest/generator.js',
        helpOptions: {
          title: 'Test generator options'
        }
      },
      unimpl: {
        modulePath: 'src/xtest/unimpl.js',
        helpOptions: {
          title: 'Test unimpl options'
        }
      },
      cwd: {
        modulePath: 'src/xtest/cwd.js',
        helpOptions: {
          title: 'CWD options'
        }
      },
      multi: {
        modulePath: 'src/xtest/multi.js',
        className: 'Multi',
        helpOptions: {
          title: 'Multiple subcommands'
        },
        subCommands: {
          first: {
            modulePath: 'src/xtest/multi.js',
            className: 'MultiFirst',
            helpOptions: {
              title: 'Multiple first'
            }
          },
          second: {
            modulePath: 'src/xtest/multi.js',
            className: 'MultiSecond',
            helpOptions: {
              title: 'Multiple second'
            }
          }
        }
      },
      noopts: {
        modulePath: 'src/xtest/noopts.js',
        helpOptions: {
          title: 'No options'
        }
      }
    })

    // The common options were already initialised by the caller,
    // and are ok, no need to redefine them.
    context.options.addGroups([
      {
        title: 'Extra options',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--extra', '--very-extra', '--very-long-extra'],
            message: 'Extra options',
            action: (context) => {
              (context.config as XtestConfig).extra = true
            },
            init: (context) => {
              (context.config as XtestConfig).extra = false
            },
            isOptional: true,
            isRequiredEarly: true
          }
        ]
      }
    ])
  }
}

// ----------------------------------------------------------------------------
