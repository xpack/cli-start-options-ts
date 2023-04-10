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
 * The `xtest multi <options> ...` command implementation.
 */

// ----------------------------------------------------------------------------

import * as cli from '../../../../../esm/index.js'
import { Context } from '../../../../../esm/index.js'

// ============================================================================

interface CliConfigMulti extends cli.Configuration {
  multi?: string | undefined
}

interface CliConfigMultiFirst extends CliConfigMulti {
  multiFirst?: string | undefined
}

interface CliConfigMultiSecond extends CliConfigMulti {
  multiSecond?: string | undefined
  moreCommon?: string | undefined
}

export class Multi extends cli.Command {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param params The generic parameters object.
   */
  constructor (params: cli.CommandConstructorParams) {
    super(params)

    const context: cli.Context = this.context
    const log = context.log
    log.trace(`${this.constructor.name}.constructor()`)

    this.context.options.addGroups(
      [
        {
          title: 'Multi options',
          isInsertInFront: true,

          optionsDefinitions: [
            {
              options: ['--multi', '-m'],
              init: (context) => {
                (context.config as CliConfigMulti).multi = undefined
              },
              action: (context, val) => {
                (context.config as CliConfigMulti).multi = val
              },
              message: 'Multi option',
              param: 'name',
              isOptional: true
            }
          ]
        }
      ]
    )
  }

  /**
   * @summary Execute the `multi` command.
   *
   * @param argv Command line arguments.
   * @returns Return code.
   *
   * @override
   */
  override async main (
    argv: string[],
    _forwardableArgv: string[]
  ): Promise<number> {
    const context: Context = this.context

    const log = context.log
    log.trace(`${this.constructor.name}.main()`)

    log.info(this.getHelpTitle())

    const config = context.config as CliConfigMulti

    if (config.multi !== undefined) {
      log.always(`multi: ${config.multi}`)
    }
    if (argv.length === 0) {
      log.always('no args')
    }
    for (const arg of argv) {
      log.always(arg)
    }

    this.outputDoneDuration()
    return cli.ExitCodes.SUCCESS
  }
}

export class MultiFirst extends Multi {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param params The generic parameters object.
   */
  constructor (params: cli.CommandConstructorParams) {
    super(params)

    this.context.options.addGroups(
      [
        {
          title: 'Multi first options',
          isInsertInFront: true,
          optionsDefinitions: [
            {
              options: ['--first'],
              init: (context) => {
                (context.config as CliConfigMultiFirst).multiFirst = undefined
              },
              action: (context, val) => {
                (context.config as CliConfigMultiFirst).multiFirst = val
              },
              message: 'Multi first option',
              param: 'int',
              isOptional: true
            }
          ]
        }
      ]
    )
  }

  /**
   * @summary Execute the `multi first` command.
   *
   * @param argv Command line arguments.
   * @returns Return code.
   *
   * @override
   */
  override async main (
    argv: string[],
    _forwardableArgv: string[]
  ): Promise<number> {
    const context: Context = this.context

    const log = context.log
    log.trace(`${this.constructor.name}.main()`)

    log.info(this.getHelpTitle())
    const config = context.config as CliConfigMultiFirst

    if (config.multi !== undefined) {
      log.always(`multi: ${config.multi}`)
    }
    if (config.multiFirst !== undefined) {
      log.always(`first: ${config.multiFirst}`)
    }
    if (argv.length === 0) {
      log.always('no args')
    }
    for (const arg of argv) {
      log.always(arg)
    }

    this.outputDoneDuration()
    return cli.ExitCodes.SUCCESS
  }
}

export class MultiSecond extends Multi {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param params The generic parameters object.
   */
  constructor (params: cli.CommandConstructorParams) {
    super(params)

    this.context.options.addGroups([
      {
        title: 'Multi second options',
        // Disabled on purpose, for coverage.
        // isInsertInFront: true,
        optionsDefinitions: [
          {
            options: ['--second'],
            init: (context) => {
              (context.config as CliConfigMultiSecond).multiSecond = undefined
            },
            action: (context, val) => {
              (context.config as CliConfigMultiSecond).multiSecond = val
            },
            message: 'Multi second option',
            param: 'int',
            isOptional: true
          }
        ]
      }
    ])
    this.context.options.appendToGroups([
      {
        title: 'Common options',
        isCommon: true,
        isInsertInFront: true,
        optionsDefinitions: [
          {
            options: ['--more-common'],
            init: (context) => {
              (context.config as CliConfigMultiSecond).moreCommon = undefined
            },
            action: (context, val) => {
              (context.config as CliConfigMultiSecond).moreCommon = val
            },
            message: 'More common second option',
            param: 'int',
            isOptional: true
          }
        ]
      }
    ])
  }

  /**
   * @summary Execute the `multi second` command.
   *
   * @param argv Command line arguments.
   * @returns Return code.
   *
   * @override
   */
  override async main (
    argv: string[],
    _forwardableArgv: string[]
  ): Promise<number> {
    const context: Context = this.context

    const log = context.log
    log.trace(`${this.constructor.name}.main()`)

    log.info(this.getHelpTitle())
    const config = context.config as CliConfigMultiSecond

    if (config.multi !== undefined) {
      log.always(`multi: ${config.multi}`)
    }
    if (config.multiSecond !== undefined) {
      log.always(`second: ${config.multiSecond}`)
    }
    if (argv.length === 0) {
      log.always('no args')
    }
    for (const arg of argv) {
      log.always(arg)
    }

    this.outputDoneDuration()
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
