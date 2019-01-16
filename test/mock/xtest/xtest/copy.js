/*
 * This file is part of the xPack distribution
 *   (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom
 * the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict'
/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/**
 * The `xtest copy <options> ...` command implementation.
 */

// ----------------------------------------------------------------------------

const fs = require('fs')
const path = require('path')

const Promisifier = require('@ilg/es6-promisifier').Promisifier

// ES6: `import { CliCommand, CliExitCodes, CliError } from 'cli-start-options'
const CliCommand = require('../../../../index.js').CliCommand
const CliExitCodes = require('../../../../index.js').CliExitCodes
const CliError = require('../../../../index.js').CliError

// ----------------------------------------------------------------------------

// Promisify functions from the Node.js callbacks library.
// New functions have similar names, but belong to `promises_`.
Promisifier.promisifyInPlace(fs, 'readFile')
Promisifier.promisifyInPlace(fs, 'stat')
Promisifier.promisifyInPlace(fs, 'mkdir')
Promisifier.promisifyInPlace(fs, 'writeFile')

// For easy migration, inspire from the Node 10 experimental API.
// Do not use `fs.promises` yet, to avoid the warning.
const fsPromises = fs.promises_

// ============================================================================

class Copy extends CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param {Object} args The generic arguments object.
   */
  constructor (args) {
    super(args)

    // Title displayed with the help message.
    this.helpTitle = 'Copy a file to another file'
    this.optionGroups = [
      {
        title: 'Copy options',
        optionDefs: [
          {
            options: ['--file'],
            action: (object, val) => {
              object.config.inputPath = val
            },
            init: (object) => {
              object.config.inputPath = undefined
            },
            msg: 'Input file',
            param: 'file',
            isMandatory: true
          },
          {
            options: ['--output'],
            action: (object, val) => {
              object.config.outputPath = val
            },
            init: (object) => {
              object.config.outputPath = undefined
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
   * @param {string[]} argv Command line arguments.
   * @returns {number} Return code.
   *
   * @override
   */
  async doRun (argv) {
    const log = this.log
    log.trace(`${this.constructor.name}.doRun()`)

    log.info(this.helpTitle)
    const config = this.config
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
      if (!await fsPromises.stat(folderPath)) {
        await fsPromises.mkdir(folderPath)
      }
      await fsPromises.writeFile(outputAbsolutePath, inputData, 'utf8')
    } catch (err) {
      throw new CliError(err.message, CliExitCodes.ERROR.OUTPUT)
    }

    // log.info('Done.')
    this.outputDoneDuration()
    return CliExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The Copy class is added as a property of this object.
module.exports.Copy = Copy

// In ES6, it would be:
// export class Copy { ... }
// ...
// import { Copy } from 'copy.js'

// ----------------------------------------------------------------------------
