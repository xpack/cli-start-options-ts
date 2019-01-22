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
const util = require('util')
const path = require('path')

const CliHelp = require('./cli-help').CliHelp
const CliExitCodes = require('./cli-error.js').CliExitCodes
const Logger = require('@xpack/logger').Logger
const CliOptions = require('./cli-options.js').CliOptions

const CliUtil = require('./cli-util.js').CliUtil

// ============================================================================

/**
 * @typedef {Object} CliCommand instance.
 * @property {Console} console
 * @property {Logger} log
 * @property {String} programName
 * @property {String} processCwd
 * @property {Object} config
 * @property {String[]} matchedCommands
 * @property {CliOptions} cliOptions
 * @property {Date} startTime
 */

/**
 * @classdesc
 * Base class for all CLI commands.
 */
// export
class CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a command instance.
   *
   * @param {Object} params The generic parameters object.
   */
  constructor (params) {
    assert(params, 'There must be params.')

    assert(params.console)
    this.console = params.console

    this.log = params.log || new Logger({
      console: params.console
    })

    const log = this.log
    log.trace(`${this.constructor.name}.constructor()`)

    assert(params.programName)
    this.programName = params.programName

    assert(params.cwd)
    this.processCwd = params.cwd

    if (params.package) {
      this.package = params.package
    }

    if (params.rootAbsolutePath) {
      this.rootAbsolutePath = params.rootAbsolutePath
    }

    // Member variables with defaults.
    this.config = params.config || {}
    this.matchedCommands = params.matchedCommands || []
    this.cliOptions = params.cliOptions || new CliOptions()
    this.startTime = params.startTime || Date.now()
  }

  /**
   * @summary Execute the command.
   *
   * @param {String[]} argv Array of arguments.
   * @returns {Number} Return code.
   */
  async run (argv) {
    const log = this.log
    log.trace(`${this.constructor.name}.run()`)

    // Not used here, but offered to the implementation.
    assert(this.package)

    // Commands must always have at least a single string as command.
    assert(this.matchedCommands)
    assert(this.matchedCommands.length > 0)

    const config = this.config

    if (!this.optionGroups) {
      this.optionGroups = []
    }

    this.cliOptions.initOptionGroups(this.optionGroups, this)
    const remaining =
      this.cliOptions.parseOptions(argv, this, this.optionGroups)

    log.trace(util.inspect(config))

    if (config.isHelpRequest) {
      this.help({
        outputAlways: true
      })
      return CliExitCodes.SUCCESS // Ok, command help explicitly called.
    }

    const missing = this.cliOptions.checkMissing(this.optionGroups)
    if (missing) {
      missing.forEach((msg) => {
        log.error(msg)
      })
      this.help()
      return CliExitCodes.ERROR.SYNTAX // Error, missing mandatory option.
    }

    // Check if there are more unrecognised options.
    if (remaining.length) {
      let i = 0
      for (; i < remaining.length; ++i) {
        const arg = remaining[i]
        if (arg === '--') {
          break
        }
        if (arg.startsWith('-')) {
          log.warn(`Option '${arg}' not supported; ignored`)
        }
      }
    }

    const code = await this.doRun(remaining)
    return code
  }

  /**
   * @summary Abstract `doRun()` method.
   *
   * @param {String[]} argv Array of arguments.
   * @returns {Number} Return code.
   *
   * @override
   */
  async doRun (argv) {
    assert(false,
      `Abstract ${this.constructor.name}.doRun(),` +
      ' redefine it in your derived class.')
  }

  /**
   * @summary Output command or application help.
   *
   * @param {Object} params The generic parameters object.
   * @returns {undefined} Nothing.
   *
   * @description
   * Override it in the application if custom content is desired.
   *
   * @override
   */
  help (params = {}) {
    const log = this.log
    log.trace(`${this.constructor.name}.help()`)

    const help = new CliHelp({
      object: this,
      outputAlways: params.outputAlways
    })

    const commonOptionGroups = this.optionsGroups ||
      this.cliOptions.getCommonOptionGroups()
    const title = this.helpTitle
    assert(title, 'Mandatory helpTitle missing.')

    help.outputAll({
      obj: this,
      matchedCommands: this.matchedCommands,
      title,
      optionGroups: commonOptionGroups
    })
  }

  /**
   * @summary Output the usage line.
   *
   * @param {CliHelp} helper Reference to a helper object.
   * @returns {undefined} Nothing.
   *
   * @description
   * The default code outputs a generic '<options>...', followed by
   * some dots; this should work for mos cases, but is not very helpful.
   *
   * If the command has more specific option definitions, for example
   * the file names, paths, etc, redefine this and replace the final
   * dots with the explicit definitions.
   *
   * @override
   */
  doHelpUsage (helper) {
    let usage
    usage = `Usage: ${this.programName}`
    if (this.matchedCommands.length > 0) {
      usage += ` ${this.matchedCommands}`
    } else if (this.cmdsTree.hasCommands()) {
      usage += ' <command>'
      // doHelpWhere() must list the commands.
    }
    usage += ` [<options>...] ...`

    helper.output(usage)
  }

  /**
   * @summary Output the 'where' details.
   *
   * @param {CLiHelp} helper Reference to a helper object.
   * @param {Object} more Object used to handle the two pass processing.
   * @returns {undefined} Nothing.
   *
   * @description
   * If the usage is redefined to add explicit definitions, they can be
   * further explained in a custom 'where' section.
   *
   * @override
   */
  doHelpWhere (helper, more) {
    // Nothing.
  }

  /**
   * @summary Display the completed command and the durations.
   *
   * @returns {undefined} Nothing.
   */
  outputDoneDuration () {
    const log = this.log

    log.info()
    const durationString =
      CliUtil.formatDuration(Date.now() - this.startTime)
    const cmdDisplay = [this.programName, ...this.matchedCommands].join(' ')
    log.info(`'${cmdDisplay}' completed in ${durationString}.`)
  }

  /**
   * @summary Make a path absolute.
   *
   * @param {String} inPath A file or folder path.
   * @returns {String} The absolute path.
   *
   * @description
   * If the path is already absolute, resolve it and return.
   * Otherwise, use the configuration CWD or the process CWD to
   * make the path absolute, resolve it and return.
   * To 'resolve' means to process possible `.` or `..` segments.
   */
  makePathAbsolute (inPath) {
    if (path.isAbsolute(inPath)) {
      return path.resolve(inPath)
    }
    return path.resolve(this.config.cwd || this.processCwd, inPath)
  }

  /**
   * @Summary Add a generator record to the destination object.
   *
   * @param {Object} obj The destination object.
   * @param {String[]} argv Array of arguments.
   * @returns {Object} The same object.
   *
   * @description
   * For traceability purposes, the command line used to invoke the
   * program is copied to the object, which will usually serialised
   * into a JSON.
   * Multiple generators are possible, each call will append a new
   * element to the array.
   */
  addGenerator (obj, argv) {
    if (!obj.generators) {
      const generators = []
      obj.generators = generators
    }

    const generator = {}
    generator.tool = this.programName
    generator.version = this.package.version
    generator.command =
      [this.programName, ...this.matchedCommands, ...argv]

    if (this.package.homepage) {
      generator.homepage = this.package.homepage
    }
    generator.date = (new Date()).toISOString()

    obj.generators.push(generator)

    return obj
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
