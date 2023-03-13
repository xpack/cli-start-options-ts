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

/**
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

import {
  CliApplication,
  CliContext,
  CliOptions
} from '../../../../esm/index.js'

// ============================================================================

export class Wtest extends CliApplication {
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
  constructor (context: CliContext) {
    super(context)

    // Mandatory, must be set here, not in the library, since it computes
    // the root path as relative to the path of this file..
    this.context.rootPath =
      path.dirname(path.dirname(fileURLToPath(import.meta.url)))

    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.
    CliOptions.addCommand(['one-long-command'], '')
    CliOptions.addCommand(['two-long-command'], '')
    CliOptions.addCommand(['three-long-command'], '')
    CliOptions.addCommand(['four-long-command'], '')
    CliOptions.addCommand(['five-long-command'], '')
    CliOptions.addCommand(['six-long-command'], '')

    // The common options were already initialised by the caller,
    // and are ok, no need to redefine them.
  }
}

// ----------------------------------------------------------------------------
