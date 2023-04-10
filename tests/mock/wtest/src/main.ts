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
 * The Wtest main module.
 *
 * It is re-exported publicly by `index.js`.
 *
 * To import classes from this module into Node.js applications, use:
 *
 * ```javascript
 * const Wtest = require('ztest').Wtest
 * ```
 */

// ----------------------------------------------------------------------------

import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

import * as cli from '../../../../esm/index.js'

// ============================================================================

export class Wtest extends cli.Application {
  // --------------------------------------------------------------------------

  /**
   * @summary Initialise the application class object.
   *
   * @returns Nothing.
   *
   * @description
   * Initialise the options manager with application
   * specific commands and common options.
   *
   * @override
   */
  constructor (params: cli.ApplicationConstructorParams) {
    super(params)

    const context: cli.Context = this.context
    const log = context.log
    log.trace(`${this.constructor.name}.constructor()`)

    // Mandatory, must be set here, not in the library, since it computes
    // the root path as relative to the path of this file..
    context.rootPath =
      path.dirname(path.dirname(fileURLToPath(import.meta.url)))

    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.
    this.commandsTree.addCommands({
      'one-long-command': {
        moduleRelativePath: '.'
      },
      'two-long-command': {
        moduleRelativePath: '.'
      },
      'three-long-command': {
        moduleRelativePath: '.'
      },
      'four-long-command': {
        moduleRelativePath: '.'
      },
      'five-long-command': {
        moduleRelativePath: '.'
      },
      'six-long-command': {
        moduleRelativePath: '.'
      }
    })
  }
}

// ----------------------------------------------------------------------------
