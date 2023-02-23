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

import {
  CliCommand, CliConfig, CliContext, CliExitCodes
} from '../../../../../src/index.js'

// ============================================================================

interface CliConfigLong extends CliConfig {
  long: string | undefined
}

export class Long extends CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param {Object} context Reference to a context.
   */
  constructor (context: CliContext) {
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

    log.info('Done.')
    return CliExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
