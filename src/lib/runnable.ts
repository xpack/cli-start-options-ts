/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/license/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * This file provides the base class for application commands.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

import { Context } from './context.js'

// ----------------------------------------------------------------------------

export interface RunnableConstructorParams {
  context: Context
}

export abstract class Runnable {
  // --------------------------------------------------------------------------

  public context: Context

  // --------------------------------------------------------------------------
  /**
   * @summary Constructor, to remember the context.
   *
   * @param params Reference to an object with constructor parameters.
   */
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor (params: RunnableConstructorParams) {
    assert(params)
    assert(params.context)

    this.context = params.context
  }

  /**
   * @summary Abstract `run()` method.
   *
   * @param argv Array of arguments.
   * @returns A promise resolving to the Exit code.
   */
  abstract run (argv: string[]): Promise<number>
}

// ----------------------------------------------------------------------------
