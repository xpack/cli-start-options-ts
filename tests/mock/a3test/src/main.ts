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

import * as cli from '../../../../esm/index.js'

// ============================================================================

export class Test extends cli.Application {
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
  }

  // --------------------------------------------------------------------------
}

// ----------------------------------------------------------------------------
