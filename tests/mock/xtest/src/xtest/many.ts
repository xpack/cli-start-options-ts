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

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/**
 * The `xtest many` command implementation.
 */

// ----------------------------------------------------------------------------

import {
  CliCommand, CliConfiguration, CliContext, CliExitCodes
} from '../../../../../dist/index.js'

// ============================================================================

interface CliConfigMany extends CliConfiguration {
  one: string | undefined
  two: string | undefined
  three: string | undefined
  four: string | undefined
}

export class Long extends CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param context Reference to a context.
   */
  constructor (context: CliContext) {
    super(context)

    // Title displayed with the help message.
    this.title = 'Test many options'
    this.optionGroups = [
      {
        title: 'Long options',
        preOptions: '[<name1> <name2> <name3>...]',
        optionDefs: [
          {
            options: ['--one'],
            action: (context, val) => {
              (context.config as CliConfigMany).one = val
            },
            init: (context) => {
              (context.config as CliConfigMany).one = undefined
            },
            msg: 'Option one',
            param: 'name',
            isOptional: false
          },
          {
            options: ['--two'],
            action: (context, val) => {
              (context.config as CliConfigMany).two = val
            },
            init: (context) => {
              (context.config as CliConfigMany).two = undefined
            },
            msg: 'Option two',
            param: 'name',
            isOptional: false,
            isMultiple: true
          },
          {
            options: ['--three'],
            action: (context, val) => {
              (context.config as CliConfigMany).three = val
            },
            init: (context) => {
              (context.config as CliConfigMany).three = undefined
            },
            msg: 'Option three',
            param: 'name',
            isOptional: true,
            isMultiple: true
          },
          {
            options: ['--four'],
            action: (context, val) => {
              (context.config as CliConfigMany).four = val
            },
            init: (context) => {
              (context.config as CliConfigMany).four = undefined
            },
            msg: 'Option four',
            // Has no param.
            hasValue: true,
            isOptional: true
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
