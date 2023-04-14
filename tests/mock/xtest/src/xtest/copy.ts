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
 * The `xtest copy <options> ...` command implementation.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'

// ----------------------------------------------------------------------------

import * as cli from '../../../../../esm/index.js'

// ============================================================================

interface CliConfigCopy extends cli.Configuration {
  inputPath: string | undefined
  outputPath: string | undefined
}

export class Copy extends cli.Command {
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
        description: 'Copy options',
        optionsDefinitions: [
          {
            options: ['--file'],
            init: (context) => {
              (context.config as CliConfigCopy).inputPath = undefined
            },
            action: (context, val) => {
              (context.config as CliConfigCopy).inputPath = val
            },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              description: 'Input file',
              valueDescription: 'file'
            }
          },
          {
            options: ['--output'],
            init: (context) => {
              (context.config as CliConfigCopy).outputPath = undefined
            },
            action: (context, val) => {
              (context.config as CliConfigCopy).outputPath = val
            },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              description: 'Output file',
              valueDescription: 'file'
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

    log.info(this.getCommandDescription())
    const config: CliConfigCopy = (this.context.config as CliConfigCopy)

    assert(config.inputPath)
    const inputAbsolutePath = this.makePathAbsolute(config.inputPath)
    log.info(`Reading '${inputAbsolutePath}'...`)
    let inputData
    try {
      inputData = await fs.promises.readFile(inputAbsolutePath, 'utf8')
    } catch (err: any) {
      throw new cli.Error(err.message, cli.ExitCodes.ERROR.INPUT)
    }

    assert(config.outputPath) // Mandatory.
    const outputAbsolutePath = this.makePathAbsolute(config.outputPath)
    const folderPath = path.dirname(outputAbsolutePath)

    log.info(`Writing '${outputAbsolutePath}'...`)

    try {
      await fs.promises.stat(folderPath)
    } catch (err: any) {
      await fs.promises.mkdir(folderPath)
    }

    try {
      await fs.promises.writeFile(outputAbsolutePath, inputData, 'utf8')
    } catch (err: any) {
      throw new cli.Error(err.message, cli.ExitCodes.ERROR.OUTPUT)
    }

    log.info('Done.')
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
