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
            init: (context) => {
              (context.config as CliConfigMany).one = undefined
            },
            action: (context, val) => {
              (context.config as CliConfigMany).one = val
            },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              description: 'Option one',
              valueDescription: 'name'
            }
          },
          {
            options: ['--two'],
            init: (context) => {
              (context.config as CliConfigMany).two = undefined
            },
            action: (context, val) => {
              (context.config as CliConfigMany).two = val
            },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              description: 'Option two',
              valueDescription: 'name',
              isMultiple: true
            }
          },
          {
            options: ['--three'],
            init: (context) => {
              (context.config as CliConfigMany).three = undefined
            },
            action: (context, val) => {
              (context.config as CliConfigMany).three = val
            },
            hasValue: true,
            helpDefinitions: {
              description: 'Option three',
              valueDescription: 'name',
              isMultiple: true
            }
          },
          {
            options: ['--four'],
            init: (context) => {
              (context.config as CliConfigMany).four = undefined
            },
            action: (context, val) => {
              (context.config as CliConfigMany).four = val
            },
            hasValue: true,
            helpDefinitions: {
              description: 'Option four'
              // Has no parameterDescription.
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
