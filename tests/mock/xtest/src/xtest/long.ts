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
 * The `xtest long` command implementation.
 */

// ----------------------------------------------------------------------------

import * as cli from '../../../../../esm/index.js'

// ============================================================================

interface CliConfigLong extends cli.Configuration {
  long: string | undefined
}

export class Long extends cli.Command {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param context Reference to a context.
   */
  constructor (params: cli.CommandConstructorParams) {
    super(params)

    this.context.options.addGroups([
      {
        title: 'Long options',
        optionsDefinitions: [
          {
            options: ['--long', '--very-long', '--extra-very-long'],
            action: (context, val) => {
              (context.config as CliConfigLong).long = val
            },
            init: (context) => {
              (context.config as CliConfigLong).long = undefined
            },
            message: 'Very long option',
            param: 'name',
            isOptional: true
          }
        ]
      }
    ])
  }

  /**
   * @summary Execute the `copy` command.
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

    log.info(this.getHelpTitle())
    // const config = this.context.config

    log.info('Done.')
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
