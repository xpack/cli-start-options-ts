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
 * The `xtest copy <options> ...` command implementation.
 */

// ----------------------------------------------------------------------------

import {
  CliCommand,
  CliContext,
  CliExitCodes
} from '../../../../../dist/index.js'

// ============================================================================

export class Copy extends CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param context Reference to a context.
   */
  constructor (context: CliContext) {
    super(context)

    // Title displayed with the help message.
    this.title = 'Exercise verbosity'
    this.optionGroups = [
    ]
  }

  /**
   * @summary Execute the `verbosity` command.
   *
   * @param _args Command line arguments.
   * @returns Return code.
   *
   * @override
   */
  override async run (_args: string[]): Promise<number> {
    const log = this.log
    log.trace(`${this.constructor.name}.run()`)

    log.info(this.title)

    log.verbose('Verbose')

    log.info('Done.')
    return CliExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
