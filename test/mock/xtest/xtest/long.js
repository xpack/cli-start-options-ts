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
 * The `xtest long` command implementation.
 */

// ----------------------------------------------------------------------------

// ES6: `import { CliCommand, CliExitCodes, CliError } from 'cli-start-options'
const CliCommand = require('../../../../index.js').CliCommand
const CliExitCodes = require('../../../../index.js').CliExitCodes

// ============================================================================

class Long extends CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param {Object} params The generic parameters object.
   */
  constructor (params) {
    super(params)

    // Title displayed with the help message.
    this.helpTitle = 'Test long options'

    this.cliOptions.addOptionsGroups(
      [
        {
          title: 'Long options',
          insertInFront: true,
          // preOptions: '[<name>...]', // Array of test names.
          // postOptions: '[-- <very-long-long-long-params>...]',
          optionsDefs: [
            {
              options: ['--long', '--very-long', '--extra-very-long'],
              init: ({ config }) => {
                config.long = undefined
              },
              action: ({ config }, val) => {
                config.long = val
              },
              msg: 'Very long option',
              param: 'name',
              isMandatory: true
            }
          ]
        }
      ]
    )

    this.cliOptions.hasForwardableArgs = true
    this.cliOptions.hasNoCustomOptions = true

    this.helpOptions.usageMoreOptions =
      '[<name>...] [-- <very-long-long-long-params>...]'
  }

  /**
   * @summary Execute the `copy` command.
   *
   * @param {string[]} args Command line arguments.
   * @returns {number} Return code.
   *
   * @override
   */
  async doRun (args, forwardedArgs) {
    const log = this.log
    log.trace(`${this.constructor.name}.doRun()`)

    log.info(this.helpTitle)

    log.info(`Args: ${args}`)
    log.info(`FwdArgs: ${forwardedArgs}`)
    // log.info('Done.')
    this.outputDoneDuration()
    return CliExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The class is added as a property of this object.
module.exports.Long = Long

// In ES6, it would be:
// export class Long { ... }
// ...
// import { Long } from 'long.js'

// ----------------------------------------------------------------------------
