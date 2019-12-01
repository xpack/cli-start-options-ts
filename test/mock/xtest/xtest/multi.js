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
 * The `xtest multi <options> ...` command implementation.
 */

// ----------------------------------------------------------------------------

// ES6: `import { CliCommand, CliExitCodes, CliError } from 'cli-start-options'
const CliCommand = require('../../../../index.js').CliCommand
const CliExitCodes = require('../../../../index.js').CliExitCodes

// ----------------------------------------------------------------------------

// ============================================================================

class Multi extends CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param {Object} params The generic parameters object.
   */
  constructor (params) {
    super(params)

    this.cliOptions.addOptionsGroups(
      [
        {
          title: 'Multi options',
          insertInFront: true,
          optionsDefs: [
            {
              options: ['-m', '--multi'],
              init: ({ config }) => {
                config.multi = undefined
              },
              action: ({ config }, val) => {
                config.multi = val
              },
              msg: 'Multi option',
              param: 'name',
              isMandatory: false
            }
          ]
        }
      ]
    )
  }

  /**
   * @summary Execute the `multi` command.
   *
   * @param {string[]} args Command line arguments.
   * @returns {number} Return code.
   *
   * @override
   */
  async doRun (args) {
    const log = this.log
    log.trace(`${this.constructor.name}.doRun()`)

    log.info(this.helpTitle)
    const config = this.config

    if (config.multi !== undefined) {
      log.always(`multi: ${config.multi}`)
    }
    if (args.length === 0) {
      log.always('no args')
    }
    for (const arg of args) {
      log.always(arg)
    }

    this.outputDoneDuration()
    return CliExitCodes.SUCCESS
  }
}

class MultiFirst extends Multi {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param {Object} params The generic parameters object.
   */
  constructor (params) {
    super(params)

    this.cliOptions.addOptionsGroups(
      [
        {
          title: 'Multi first options',
          insertInFront: true,
          optionsDefs: [
            {
              options: ['--first'],
              init: ({ config }) => {
                config.multiFirst = undefined
              },
              action: ({ config }, val) => {
                config.multiFirst = val
              },
              msg: 'Multi first option',
              param: 'int',
              isMandatory: false
            }
          ]
        }
      ]
    )
  }

  /**
   * @summary Execute the `multi first` command.
   *
   * @param {string[]} args Command line arguments.
   * @returns {number} Return code.
   *
   * @override
   */
  async doRun (args) {
    const log = this.log
    log.trace(`${this.constructor.name}.doRun()`)

    log.info(this.helpTitle)
    const config = this.config

    if (config.multi !== undefined) {
      log.always(`multi: ${config.multi}`)
    }
    if (config.multiFirst !== undefined) {
      log.always(`first: ${config.multiFirst}`)
    }
    if (args.length === 0) {
      log.always('no args')
    }
    for (const arg of args) {
      log.always(arg)
    }

    this.outputDoneDuration()
    return CliExitCodes.SUCCESS
  }
}

class MultiSecond extends Multi {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to set help definitions.
   *
   * @param {Object} params The generic parameters object.
   */
  constructor (params) {
    super(params)

    this.cliOptions.addOptionsGroups(
      [
        {
          title: 'Multi second options',
          // Disabled on purpose, for coverage.
          // insertInFront: true,
          optionsDefs: [
            {
              options: ['--second'],
              init: ({ config }) => {
                config.multiSecond = undefined
              },
              action: ({ config }, val) => {
                config.multiSecond = val
              },
              msg: 'Multi second option',
              param: 'int',
              isMandatory: false
            }
          ]
        },
        {
          title: 'Common options',
          insertInFront: true,
          optionsDefs: [
            {
              options: ['--more-common'],
              init: ({ config }) => {
                config.moreCommon = undefined
              },
              action: ({ config }, val) => {
                config.moreCommon = val
              },
              msg: 'More common second option',
              param: 'int',
              isMandatory: false
            }
          ]
        }
      ]
    )
  }

  /**
   * @summary Execute the `multi second` command.
   *
   * @param {string[]} args Command line arguments.
   * @returns {number} Return code.
   *
   * @override
   */
  async doRun (args) {
    const log = this.log
    log.trace(`${this.constructor.name}.doRun()`)

    log.info(this.helpTitle)
    const config = this.config

    if (config.multi !== undefined) {
      log.always(`multi: ${config.multi}`)
    }
    if (config.multiSecond !== undefined) {
      log.always(`second: ${config.multiSecond}`)
    }
    if (args.length === 0) {
      log.always('no args')
    }
    for (const arg of args) {
      log.always(arg)
    }

    this.outputDoneDuration()
    return CliExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The class is added as a property of this object.
module.exports.Multi = Multi
module.exports.MultiFirst = MultiFirst
module.exports.MultiSecond = MultiFirst
module.exports.MultiSecond = MultiSecond

// In ES6, it would be:
// export class Multi { ... }
// ...
// import { Multi } from 'multi.js'

// ----------------------------------------------------------------------------
