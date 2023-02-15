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
 * The `xtest copy <options> ...` command implementation.
 */

// ----------------------------------------------------------------------------

import * as fs from 'node:fs'
import * as path from 'node:path'

// ----------------------------------------------------------------------------

// ES6: `import { CliCommand, CliExitCodes, CliError } from 'cli-start-options'
import { CliCommand, CliExitCodes, CliError } from '../../../../dist/index.js'

// ----------------------------------------------------------------------------

const fsPromises = fs.promises

// ============================================================================

export class Copy extends CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param {Object} context Reference to a context.
   */
  constructor (context) {
    super(context)

    // Title displayed with the help message.
    this.title = 'Copy a file to another file'
    this.optionGroups = [
      {
        title: 'Copy options',
        optionDefs: [
          {
            options: ['--file'],
            action: (context, val) => {
              context.config.inputPath = val
            },
            init: (context) => {
              context.config.inputPath = undefined
            },
            msg: 'Input file',
            param: 'file',
            isMandatory: true
          },
          {
            options: ['--output'],
            action: (context, val) => {
              context.config.outputPath = val
            },
            init: (context) => {
              context.config.outputPath = undefined
            },
            msg: 'Output file',
            param: 'file',
            isMandatory: true
          }
        ]
      }
    ]
  }

  /**
   * @summary Execute the `copy` command.
   *
   * @param {string[]} args Command line arguments.
   * @returns {number} Return code.
   *
   * @override
   */
  async doRun (args) {
    const log = this.log
    log.trace(`${this.constructor.name}.doRun()`)

    log.info(this.title)
    const config = this.context.config
    const inputAbsolutePath = this.makePathAbsolute(config.inputPath)
    log.info(`Reading '${inputAbsolutePath}'...`)
    let inputData
    try {
      inputData = await fsPromises.readFile(inputAbsolutePath, 'utf8')
    } catch (err) {
      throw new CliError(err.message, CliExitCodes.ERROR.INPUT)
    }

    this.inputFileName = path.basename(config.inputPath)

    const outputAbsolutePath = this.makePathAbsolute(config.outputPath)
    const folderPath = path.dirname(outputAbsolutePath)

    log.info(`Writing '${outputAbsolutePath}'...`)
    try {
      if (!(await fsPromises.stat(folderPath))) {
        await fsPromises.mkdir(folderPath)
      }
      await fsPromises.writeFile(outputAbsolutePath, inputData, 'utf8')
    } catch (err) {
      throw new CliError(err.message, CliExitCodes.ERROR.OUTPUT)
    }

    log.info('Done.')
    return CliExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
