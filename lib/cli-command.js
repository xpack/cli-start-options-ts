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

/*
 * This file provides the base class for application commands.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')

// ES6: `import { CliOptions, CliHelp } from 'cli-start-options'
const CliOptions = require('./cli-options.js').CliOptions
const CliHelp = require('./cli-help').CliHelp

// ============================================================================

/**
 * @classdesc
 * Base class for a CLI application command.
 */
// export
class CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to remember the context.
   *
   * @param {Object} context Reference to a context.
   */
  constructor (context) {
    this.context = context
  }

  /**
   * @summary Execute the command.
   *
   * @param {string[]} argv Array of arguments.
   * @returns {number} Return code.
   */
  run (argv) {
    return this.doRun(argv)
  }

  /**
   * @summary Abstract `doRun()` method.
   *
   * @param {string[]} argv Array of arguments.
   * @returns {number} Return code.
   */
  doRun (argv) {
    assert(false,
      'Abstract CliCmd.doRun() method, redefine it in your derived class.')
  }

  /**
   * @summary Output command help
   *
   * @returns {undefined} Nothing.
   */
  help () {
    const help = new CliHelp(this.context)

    help.outputCommandLine(this.title, this.options)

    help.twoPassAlign(() => {
      this.options.forEach((opts) => {
        help.outputOptions(opts.options, opts.title)
      })
      help.outputCommonOptions(CliOptions.getCommonOptions())
      help.outputHelpDetails(CliOptions.getCommonOptions())
      help.outputEarlyDetails(CliOptions.getCommonOptions())
    })

    help.outputFooter()
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The CliCommand class is added as a property of this object.
module.exports.CliCommand = CliCommand

// In ES6, it would be:
// export class CliCommand { ... }
// ...
// import { CliCommand } from 'cli-command.js'

// ----------------------------------------------------------------------------
