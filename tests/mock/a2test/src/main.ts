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

import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

import { CliApplication, CliContext } from '../../../../dist/index.js'

// ============================================================================

export class Test extends CliApplication {
  // --------------------------------------------------------------------------

  constructor (context: CliContext) {
    super(context)

    // Mandatory, must be set here, not in the library, since it computes
    // the root path as relative to the path of this file..
    this.context.rootPath =
      path.dirname(path.dirname(fileURLToPath(import.meta.url)))
  }

  // --------------------------------------------------------------------------
}

// ----------------------------------------------------------------------------
