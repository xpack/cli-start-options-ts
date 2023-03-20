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
 * The `xtest long` command implementation.
 */

// ----------------------------------------------------------------------------

import * as cli from '../../../../../esm/index.js'

// ============================================================================

export class Unimpl extends cli.Command {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param context Reference to a context.
   */
  constructor (application: cli.Application) {
    super({
      application,
      // Title displayed by the help message.
      title: 'Test unimpl options'
    })
  }
}

// ----------------------------------------------------------------------------
