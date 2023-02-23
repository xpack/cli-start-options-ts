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
 * The `xtest long` command implementation.
 */

// ----------------------------------------------------------------------------

import * as util from 'node:util'

// ----------------------------------------------------------------------------

import {
  CliCommand,
  CliContext,
  CliExitCodes
} from '../../../../../src/index.js'

// ============================================================================

export class Generator extends CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param {Object} context Reference to a context.
   */
  constructor (context: CliContext) {
    super(context)

    // Title displayed with the help message.
    this.title = 'Test generator options'
    this.optionGroups = [
    ]
  }

  /**
   * @summary Execute the `copy` command.
   *
   * @param {string[]} _args Command line arguments.
   * @returns {number} Return code.
   *
   * @override
   */
  override async doRun (_args: string[]): Promise<number> {
    const log = this.log
    log.trace(`${this.constructor.name}.doRun()`)

    log.info(this.title)
    // const config = this.context.config

    const object = {}
    this.addGenerator(object)

    log.output(util.inspect(object, { depth: 3 }))

    log.info('Done.')
    return CliExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
