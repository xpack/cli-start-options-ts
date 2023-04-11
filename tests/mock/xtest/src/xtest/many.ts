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
  constructor (params: cli.CommandConstructorParams) {
    super(params)

    const context: cli.Context = this.context
    const log = context.log
    log.trace(`${this.constructor.name}.constructor()`)

    this.context.options.addGroups([
      {
        title: 'Many options',
        optionsDefinitions: [
          {
            options: ['--one'],
            action: (context, val) => {
              (context.config as CliConfigMany).one = val
            },
            init: (context) => {
              (context.config as CliConfigMany).one = undefined
            },
            param: 'name',
            isOptional: false,
            helpDefinitions: {
              message: 'Option one'
            }
          },
          {
            options: ['--two'],
            action: (context, val) => {
              (context.config as CliConfigMany).two = val
            },
            init: (context) => {
              (context.config as CliConfigMany).two = undefined
            },
            param: 'name',
            isOptional: false,
            helpDefinitions: {
              message: 'Option two',
              isMultiple: true
            }
          },
          {
            options: ['--three'],
            action: (context, val) => {
              (context.config as CliConfigMany).three = val
            },
            init: (context) => {
              (context.config as CliConfigMany).three = undefined
            },
            param: 'name',
            isOptional: true,
            helpDefinitions: {
              message: 'Option three',
              isMultiple: true
            }
          },
          {
            options: ['--four'],
            action: (context, val) => {
              (context.config as CliConfigMany).four = val
            },
            init: (context) => {
              (context.config as CliConfigMany).four = undefined
            },
            // Has no param.
            hasValue: true,
            isOptional: true,
            helpDefinitions: {
              message: 'Option four'
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
    const log = this.context.log
    log.trace(`${this.constructor.name}.main()`)

    log.info(this.getHelpTitle())
    // const config = this.context.config

    log.info('Done.')
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
