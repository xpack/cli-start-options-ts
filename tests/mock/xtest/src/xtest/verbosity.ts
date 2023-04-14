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

/*
 * The `xtest verb` command implementation.
 */

// ----------------------------------------------------------------------------

import * as cli from '../../../../../esm/index.js'

// ============================================================================

export class Copy extends cli.Command {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param context Reference to a context.
   */
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor (params: cli.CommandConstructorParams) {
    super(params)

    const context: cli.Context = this.context
    const log = context.log
    log.trace(`${this.constructor.name}.constructor()`)
  }

  /**
   * @summary Execute the `verbosity` command.
   *
   * @param _args Command line arguments.
   * @returns Return code.
   *
   * @override
   */
  override async main (
    _argv: string[],
    _forwardableArgv: string[]
  ): Promise<number> {
    const log = this.context.log
    log.trace(`${this.constructor.name}.main()`)

    log.info(this.getCommandDescription())

    log.verbose('Verbose')

    log.info('Done.')
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
