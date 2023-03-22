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
 * The `xtest copy <options> ...` command implementation.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'

// ----------------------------------------------------------------------------

import * as cli from '../../../../../esm/index.js'

// ----------------------------------------------------------------------------

const fsPromises = fs.promises

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
  constructor (params: { context: cli.Context }) {
    super({
      context: params.context,
      // Title displayed by the help message.
      title: 'Copy a file to another file'
    })

    this.context.options.addGroups([
      {
        title: 'Copy options',
        optionsDefinitions: [
          {
            options: ['--file'],
            action: (context, val) => {
              (context.config as CliConfigCopy).inputPath = val
            },
            init: (context) => {
              (context.config as CliConfigCopy).inputPath = undefined
            },
            message: 'Input file',
            param: 'file',
            isOptional: false // Mandatory
          },
          {
            options: ['--output'],
            action: (context, val) => {
              (context.config as CliConfigCopy).outputPath = val
            },
            init: (context) => {
              (context.config as CliConfigCopy).outputPath = undefined
            },
            message: 'Output file',
            param: 'file',
            isOptional: false // Mandatory
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
    const config: CliConfigCopy = (this.context.config as CliConfigCopy)

    assert(config.inputPath)
    const inputAbsolutePath = this.makePathAbsolute(config.inputPath)
    log.info(`Reading '${inputAbsolutePath}'...`)
    let inputData
    try {
      inputData = await fsPromises.readFile(inputAbsolutePath, 'utf8')
    } catch (err: any) {
      throw new cli.Error(err.message, cli.ExitCodes.ERROR.INPUT)
    }

    assert(config.outputPath) // Mandatory.
    const outputAbsolutePath = this.makePathAbsolute(config.outputPath)
    const folderPath = path.dirname(outputAbsolutePath)

    log.info(`Writing '${outputAbsolutePath}'...`)

    try {
      await fsPromises.stat(folderPath)
    } catch (err: any) {
      await fsPromises.mkdir(folderPath)
    }

    try {
      await fsPromises.writeFile(outputAbsolutePath, inputData, 'utf8')
    } catch (err: any) {
      throw new cli.Error(err.message, cli.ExitCodes.ERROR.OUTPUT)
    }

    log.info('Done.')
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
