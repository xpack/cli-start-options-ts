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

const CliUtil = require('./cli-util.js').CliUtil

// ============================================================================

/**
 * @classdesc
 * Base class for all CLI application commands.
 */
// export
class CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to remember the command context.
   *
   * @param {Object} args The generic arguments object.
   */
  constructor (args) {
    assert(args, 'There must be args.')

    assert(args.log)
    this.log = args.log

    assert(args.config)
    this.config = args.config

    this.matchedCommands = args.matchedCommands || []

    assert(args.cliOptions)
    this.cliOptions = args.cliOptions

    this.startTime = args.startTime || Date.now()

    assert(args.programName)
    this.programName = args.programName

    assert(args.package)
    this.package = args.package

    assert(args.processCwd)
    this.processCwd = args.processCwd

    assert(args.rootPath)
    this.rootPath = args.rootPath

    const log = this.log
    log.trace(`${this.constructor.name}.constructor()`)
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

    const config = this.config

    this.unparsedArgs = argv
    const remaining = this.cliOptions.parseOptions(argv, this,
      this.optionGroups ? this.optionGroups : [])

    if (config.isHelpRequest) {
      this.help({
        outputAlways: true
      })
      return CliExitCodes.SUCCESS // Ok, command help explicitly called.
    }

    const commandArgs = []
    if (remaining.length) {
      let i = 0
      for (; i < remaining.length; ++i) {
        const arg = remaining[i]
        if (arg === '--') {
          break
        }
        if (arg.startsWith('-')) {
          log.warn(`Option '${arg}' not supported; ignored`)
        } else {
          commandArgs.push(arg)
        }
      }
      for (; i < remaining.length; ++i) {
        const arg = remaining[i]
        commandArgs.push(arg)
      }
    }

    const missing = this.cliOptions.checkMissing(this.optionGroups)
    if (missing) {
      missing.forEach((msg) => {
        log.error(msg)
      })
      this.help()
      return CliExitCodes.ERROR.SYNTAX // Error, missing mandatory option.
    }

    log.trace(util.inspect(config))
    this.commandArgs = commandArgs

    return this.doRun(commandArgs)
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
   * @summary Output command help
   *
   * @param {Object} args The generic arguments object.
   * @returns {undefined} Nothing.
   *
   * @description
   * Override it in the application if custom content is desired.
   *
   * @override
   */
  help (args = {}) {
    const log = this.log
    log.trace(`${this.constructor.name}.help()`)

    const help = new CliHelp({
      context: this,
      outputAlways: args.outputAlways
    })

    const commonOptionGroups = this.optionsGroups ||
      this.cliOptions.getCommonOptionGroups()
    const title = this.title || this.package.description

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
    } else if (this.cliOptions.hasCommands()) {
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
   * @summary Display Done and the durations.
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
   * @returns {Object} The same object.
   *
   * @description
   * For traceability purposes, the command line used to invoke the
   * program is copied to the object, which will usually serialised
   * into a JSON.
   * Multiple generators are possible, each call will append a new
   * element to the array.
   */
  addGenerator (obj) {
    if (!obj.generators) {
      const generators = []
      obj.generators = generators
    }

    const generator = {}
    generator.tool = this.programName
    generator.version = this.package.version
    generator.command =
      [this.programName, ...this.matchedCommands, ...this.unparsedArgs]

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
