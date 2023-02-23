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

import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

import { CliApplication } from '../../../../dist/index.js'

// ============================================================================

export class Test extends CliApplication {
  // --------------------------------------------------------------------------

  static override doInitialise (): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    // ------------------------------------------------------------------------
    // Mandatory, must be set here, not in the library, since it
    // refers to the main file.
    staticThis.rootPath =
      path.dirname(path.dirname(fileURLToPath(import.meta.url)))
  }

  // --------------------------------------------------------------------------
}

// ----------------------------------------------------------------------------
