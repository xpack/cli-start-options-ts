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

    const context: cli.Context = this.context
    const log = context.log
    log.trace(`${this.constructor.name}.constructor()`)

    this.context.options.addGroups([
      {
        description: 'Long options',
        optionsDefinitions: [
          {
            options: ['--long', '--very-long', '--extra-very-long'],
            init: (context) => {
              (context.config as CliConfigLong).long = undefined
            },
            action: (context, val) => {
              (context.config as CliConfigLong).long = val
            },
            hasValue: true,
            helpDefinitions: {
              description: 'Very long option',
              valueDescription: 'name',
              isExtraLarge: true
            }
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
    const context: cli.Context = this.context
    const log = context.log
    log.trace(`${this.constructor.name}.main()`)

    log.info(this.getCommandDescription())
    // const config = this.context.config

    log.info('Done.')
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
