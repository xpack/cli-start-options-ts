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
  constructor (context: cli.Context) {
    super(context)

    // Title displayed with the help message.
    this.title = 'Test long options'
    this.optionGroups = [
      {
        title: 'Long options',
        preOptions: '[<name>...]', // Array of test names.
        postOptions: '[-- <very-long-long-long-args>...]',
        optionDefs: [
          {
            options: ['--long', '--very-long', '--extra-very-long'],
            action: (context, val) => {
              (context.config as CliConfigLong).long = val
            },
            init: (context) => {
              (context.config as CliConfigLong).long = undefined
            },
            msg: 'Very long option',
            param: 'name',
            isOptional: false
          }
        ]
      }
    ]
  }

  /**
   * @summary Execute the `copy` command.
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
    // const config = this.context.config

    log.info('Done.')
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
