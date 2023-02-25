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

import {
  CliApplication,
  CliConfig,
  CliOptions
} from '../../../../dist/index.js'

// ============================================================================

interface XtestConfig extends CliConfig {
  extra: boolean
}

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
  static override doInitialise (): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    // ------------------------------------------------------------------------
    // Mandatory, must be set here, not in the library, since it takes
    // the shortcut of using `__dirname` of the main file.
    staticThis.rootPath =
        path.dirname(path.dirname(fileURLToPath(import.meta.url)))

    // Enable -i|--interactive
    staticThis.hasInteractiveMode = true

    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.
    CliOptions.addCommand(['copy', 'c'], 'src/xtest/copy.js')
    CliOptions.addCommand(['notclass'], 'src/xtest/not-class.js')
    // Non existent.
    CliOptions.addCommand(['con'], 'src/xtest/con.js')
    CliOptions.addCommand(['verbosity', 'c'], 'src/xtest/verbosity.js')
    CliOptions.addCommand(['long'], 'src/xtest/long.js')
    CliOptions.addCommand(['many'], 'src/xtest/many.js')
    CliOptions.addCommand(['gen'], 'src/xtest/generator.js')
    CliOptions.addCommand(['unimpl'], 'src/xtest/unimpl.js')
    CliOptions.addCommand(['cwd'], 'src/xtest/cwd.js')

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
                (context.config as XtestConfig).extra = true
              },
              init: (context) => {
                (context.config as XtestConfig).extra = false
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
