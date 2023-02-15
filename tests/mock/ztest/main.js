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

/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/**
 * The Ztest main module.
 *
 * It is re-exported publicly by `index.js`.
 *
 * To import classes from this module into Node.js applications, use:
 *
 * ```javascript
 * const Ztest = require('ztest').Ztest
 * ```
 */

// ----------------------------------------------------------------------------

import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

import { CliApplication, CliOptions } from '../../../dist/index.js'

// ----------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ============================================================================

export class Ztest extends CliApplication {
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

    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.
    CliOptions.addCommand(['verbosity', 'c'], 'ztest/verbosity.js')

    // The common options were already initialised by the caller,
    // and are ok, no need to redefine them.
  }

  // --------------------------------------------------------------------------

  // Constructor: use parent definition.
  // main(): use parent definition
  // help(): use parent definition.

  // (isn't object oriented code reuse great?)
}

// ----------------------------------------------------------------------------
