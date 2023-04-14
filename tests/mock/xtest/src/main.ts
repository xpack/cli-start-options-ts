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
    const log = context.log
    log.trace(`${this.constructor.name}.constructor()`)

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
        moduleRelativePath: 'src/xtest/copy.js',
        helpDefinitions: {
          description: 'Copy a file to another file'
        }
      },
      notclass: {
        moduleRelativePath: 'src/xtest/not-class.js'
      },
      con: {
        moduleRelativePath: 'src/xtest/con.js'
      },
      verbosity: {
        aliases: ['vb'],
        moduleRelativePath: 'src/xtest/verbosity.js',
        helpDefinitions: {
          description: 'Exercise verbosity'
        }
      },
      long: {
        moduleRelativePath: 'src/xtest/long.js',
        helpDefinitions: {
          description: 'Test long options',
          usagePreOptions: '[<name>...]', // Array of test names.
          usagePostOptions: '[-- <very-long-long-long-args>...]'
        }
        // hasCustomOptions: false
      },
      many: {
        moduleRelativePath: 'src/xtest/many.js',
        helpDefinitions: {
          description: 'Test many options',
          usagePreOptions: '[<name1> <name2> <name3>...]'
        }
      },
      gen: {
        moduleRelativePath: 'src/xtest/generator.js',
        helpDefinitions: {
          description: 'Test generator options'
        }
      },
      unimpl: {
        moduleRelativePath: 'src/xtest/unimpl.js',
        helpDefinitions: {
          description: 'Test unimpl options'
        }
      },
      cwd: {
        moduleRelativePath: 'src/xtest/cwd.js',
        helpDefinitions: {
          description: 'CWD options'
        }
      },
      multi: {
        moduleRelativePath: 'src/xtest/multi.js',
        className: 'Multi',
        helpDefinitions: {
          description: 'Multiple subcommands'
        },
        hasCustomArgs: true,
        subCommands: {
          first: {
            moduleRelativePath: 'src/xtest/multi.js',
            className: 'MultiFirst',
            helpDefinitions: {
              description: 'Multiple first'
            },
            hasCustomArgs: true
          },
          second: {
            moduleRelativePath: 'src/xtest/multi.js',
            className: 'MultiSecond',
            helpDefinitions: {
              description: 'Multiple second'
            },
            hasCustomArgs: true
          }
        }
      },
      noopts: {
        moduleRelativePath: 'src/xtest/noopts.js',
        helpDefinitions: {
          description: 'No options'
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
            init: (context) => {
              (context.config as XtestConfig).extra = false
            },
            action: (context) => {
              (context.config as XtestConfig).extra = true
            },
            helpDefinitions: {
              description: 'Extra options',
              isRequiredEarly: true
            }
          }
        ]
      }
    ])
  }
}

// ----------------------------------------------------------------------------
