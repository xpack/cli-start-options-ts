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
 * The `xtest many` command implementation.
 */

// ----------------------------------------------------------------------------

import * as cli from '../../../../../esm/index.js'

// ============================================================================

interface CliConfigMany extends cli.Configuration {
  one: string | undefined
  two: string | undefined
  three: string | undefined
  four: string | undefined
}

export class Long extends cli.Command {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param context Reference to a context.
   */
  constructor (params: { context: cli.Context }) {
    super({
      context: params.context,
      // Title displayed by the help message.
      title: 'Test many options'
    })

    this.context.options.addGroups([
      {
        title: 'Many options',
        preOptions: '[<name1> <name2> <name3>...]',
        optionsDefinitions: [
          {
            options: ['--one'],
            action: (context, val) => {
              (context.config as CliConfigMany).one = val
            },
            init: (context) => {
              (context.config as CliConfigMany).one = undefined
            },
            message: 'Option one',
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
            message: 'Option two',
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
            message: 'Option three',
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
            message: 'Option four',
            // Has no param.
            hasValue: true,
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
  override async run (_args: string[]): Promise<number> {
    const log = this.context.log
    log.trace(`${this.constructor.name}.run()`)

    log.info(this.context.title)
    // const config = this.context.config

    log.info('Done.')
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
