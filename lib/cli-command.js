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
 *
 * The command object has the following properties:
 * - context
 * - log
 * - commands (string[])
 * - unparsedArgs (string[], all args received from main, excluding
 * the commands)
 * - commandArgs (string[], the args passed to the command after
 * parsing options)
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
 * Base class for a CLI application command.
 */
// export
class CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to remember the context.
   *
   * @param {Object} args The generic arguments object.
   * @param {Object} args.context Reference to a context.
   * @param {Object} args.context.log Reference to a logger.
   * @param {CliOptions} args.cliOptions Reference to a CLI objects.
   */
  constructor (args) {
    assert(args, 'There must be args.')

    assert(args.context)
    assert(args.context.log)

    this.context = args.context
    this.log = args.context.log
    this.commands = args.context.fullCommands

    assert(args.cliOptions)
    this.cliOptions = args.cliOptions
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

    const context = this.context
    const config = context.config

    this.unparsedArgs = argv
    const remaining = this.cliOptions.parseOptions(argv, context,
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
   */
  async doRun (argv) {
    assert(false,
      'Abstract CliCmd.doRun(), redefine it in your derived class.')
  }

  /**
   * @summary Output command help
   *
   * @param {Object} args The generic arguments object.
   * @returns {undefined} Nothing.
   */
  help (args = {}) {
    const log = this.log
    log.trace(`${this.constructor.name}.help()`)

    const help = new CliHelp({
      context: this.context,
      outputAlways: args.outputAlways
    })

    const commonOptionGroups = this.cliOptions.getCommonOptionGroups()

    help.outputAll({
      obj: this,
      cmds: this.commands,
      title: this.title,
      optionGroups: commonOptionGroups
    })
  }

  /**
   * @summary Output details about extra args.
   *
   * @param {Object} more Object to handle two pass processing.
   * @returns {undefined} Nothing.
   *
   * @description
   * The default implementation does nothing. Override it in
   * the application if needed.
   */
  doOutputHelpArgsDetails (more) {
    // Nothing.
  }

  doHelpUsage (helper) {
    const log = this.log
    let programName = this.context.programName

    let usage
    usage = `Usage: ${programName}`
    usage += ` ${this.commands}`
    usage += ` [<options>...] ...`

    log.always(usage)
  }

  doHelpWhere (helper, more) {
    // Nothing.
  }

  /**
   * @summary Display Done and the durations.
   * @returns {undefined} Nothing.
   */
  outputDoneDuration () {
    const log = this.log
    const context = this.context

    log.info()
    const durationString =
      CliUtil.formatDuration(Date.now() - context.startTime)
    const cmdDisplay = context.commands
      ? [context.programName].concat(context.commands).join(' ')
      : context.programName
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
    return path.resolve(
      this.context.config.cwd || this.context.processCwd,
      inPath
    )
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

    const context = this.context
    const generator = {}
    generator.tool = context.programName
    generator.version = context.package.version
    generator.command =
      [context.programName, ...this.commands, ...this.unparsedArgs]

    if (context.package.homepage) {
      generator.homepage = context.package.homepage
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
