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

import { strict as assert } from 'node:assert'
import * as path from 'node:path'
import * as util from 'node:util'

// ----------------------------------------------------------------------------

import { CliOptions } from './cli-options.js'
import { CliHelp } from './cli-help.js'
import { CliExitCodes } from './cli-error.js'

// ============================================================================

/**
 * @classdesc
 * Base class for a CLI application command.
 */
export class CliCommand {
  // --------------------------------------------------------------------------

  public context
  public log
  public commands
  public unparsedArgs
  public optionGroups
  public commandArgs
  public title

  /**
   * @summary Constructor, to remember the context.
   *
   * @param {Object} context Reference to a context.
   */
  constructor (context) {
    assert(context)
    assert(context.log)
    // assert(context.fullCommands)

    this.context = context
    this.log = context.log
    this.commands = context.fullCommands
  }

  /**
   * @summary Execute the command.
   *
   * @param {string[]} args Array of arguments.
   * @returns {number} Return code.
   */
  async run (args) {
    const log = this.log
    log.trace(`${this.constructor.name}.run()`)

    const context = this.context
    const config = context.config

    this.unparsedArgs = args
    const remaining = CliOptions.parseOptions(args, context,
      this.optionGroups ? this.optionGroups : [])

    if (config.isHelpRequest) {
      this.help()
      return CliExitCodes.SUCCESS // Ok, command help explicitly called.
    }

    const commandArgs = []
    if (remaining.length > 0) {
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

    const missing = CliOptions.checkMissing(this.optionGroups)
    if (missing) {
      missing.forEach((msg) => {
        log.error(msg)
      })
      this.help()
      return CliExitCodes.ERROR.SYNTAX // Error, missing mandatory option.
    }

    log.trace(util.inspect(config))
    this.commandArgs = commandArgs

    return await this.doRun(commandArgs)
  }

  /**
   * @summary Abstract `doRun()` method.
   *
   * @param {string[]} argv Array of arguments.
   * @returns {number} Return code.
   */
  async doRun (argv) {
    assert(false,
      'Abstract CliCmd.doRun(), redefine it in your derived class.')
  }

  /**
   * @summary Output command help
   *
   * @returns {undefined} Nothing.
   */
  help () {
    const help: any = new CliHelp(this.context)

    help.outputCommandLine(this.title, this.optionGroups)

    const commonOptionGroups = CliOptions.getCommonOptionGroups()
    help.twoPassAlign(() => {
      this.doOutputHelpArgsDetails(help.more)

      this.optionGroups.forEach((optionGroup) => {
        help.outputOptions(optionGroup.optionDefs, optionGroup.title)
      })
      help.outputOptionGroups(commonOptionGroups)
      help.outputHelpDetails(commonOptionGroups)
      help.outputEarlyDetails(commonOptionGroups)
    })

    help.outputFooter()
  }

  /**
   * @summary Output details about extra args.
   *
   * @returns {undefined} Nothing.
   *
   * @description
   * The default implementation does nothing. Override it in
   * the application if needed.
   */
  doOutputHelpArgsDetails (more) {
    // Nothing.
  }

  /**
   * @summary Convert a duration in ms to seconds if larger than 1000.
   * @param {number} n Duration in milliseconds.
   * @returns {string} Value in ms or sec.
   */
  formatDuration (n) {
    if (n < 1000) {
      return `${n} ms`
    }
    return `${(n / 1000).toFixed(3)} sec`
  }

  /**
   * @summary Display Done and the durations.
   * @returns {undefined} Nothing.
   */
  outputDoneDuration () {
    const log = this.log
    const context = this.context

    log.info()
    const durationString = this.formatDuration(Date.now() - context.startTime)
    const cmdDisplay = context.commands
      ? [context.programName].concat(context.commands).join(' ')
      : context.programName
    log.info(`'${cmdDisplay}' completed in ${durationString}.`)
  }

  /**
   * @summary Make a path absolute.
   *
   * @param {string} inPath A file or folder path.
   * @returns {string} The absolute path.
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
    return path.resolve(this.context.config.cwd || this.context.processCwd,
      inPath)
  }

  /**
   * @Summary Add a generator record to the destination object.
   *
   * @param {Object} object The destination object.
   * @returns {Object} The same object.
   *
   * @description
   * For traceability purposes, the command line used to invoke the
   * program is copied to the object, which will usually serialised
   * into a JSON.
   * Multiple generators are possible, each call will append a new
   * element to the array.
   */
  addGenerator (object) {
    if (!object.generators) {
      const generators = []
      object.generators = generators
    }

    const context = this.context
    const generator = {
      tool: context.programName,
      version: context.package.version,
      command: [context.programName].concat(this.commands, this.unparsedArgs),
      homepage: undefined,
      date: (new Date()).toISOString()
    }
    if (context.package.homepage) {
      generator.homepage = context.package.homepage
    }

    object.generators.push(generator)

    return object
  }
}

// ----------------------------------------------------------------------------
