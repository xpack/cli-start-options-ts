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

import { CliContext, CliConfig } from './cli-context.js'
import { CliExitCodes } from './cli-error.js'
import { CliHelp, CliMultiPass } from './cli-help.js'
import { CliLogger } from './cli-logger.js'
import { CliOptions, CliOptionGroup } from './cli-options.js'

// ============================================================================

/**
 * @classdesc
 * Base class for a CLI application command.
 */
export class CliCommand {
  // --------------------------------------------------------------------------

  public context: CliContext
  public log: CliLogger
  public commands: string
  public unparsedArgs: string[]
  public optionGroups: CliOptionGroup[]
  public commandArgs: string[]
  public title: string

  /**
   * @summary Constructor, to remember the context.
   *
   * @param {Object} context Reference to a context.
   */
  constructor (context: CliContext) {
    assert(context)
    assert(context.log)
    // assert(context.fullCommands)

    this.context = context
    this.log = context.log
    this.commands = context.fullCommands.join(' ')
  }

  /**
   * @summary Execute the command.
   *
   * @param {string[]} args Array of arguments.
   * @returns {number} Return code.
   */
  async run (args: string[]): Promise<number> {
    const log = this.log
    log.trace(`${this.constructor.name}.run()`)

    const context: CliContext = this.context
    const config: CliConfig = context.config

    this.unparsedArgs = args
    const remainingArgs: string[] = CliOptions.parseOptions(args, context,
      this.optionGroups !== undefined ? this.optionGroups : [])

    if (config.isHelpRequest) {
      this.help()
      return CliExitCodes.SUCCESS // Ok, command help explicitly called.
    }

    const commandArgs: string[] = []
    if (remainingArgs.length > 0) {
      let i = 0
      for (; i < remainingArgs.length; ++i) {
        const arg = remainingArgs[i]
        if (arg === '--') {
          break
        }
        if (arg.startsWith('-')) {
          log.warn(`Option '${arg}' not supported; ignored`)
        } else {
          commandArgs.push(arg)
        }
      }
      for (; i < remainingArgs.length; ++i) {
        const arg = remainingArgs[i]
        commandArgs.push(arg)
      }
    }

    const missingErrors = CliOptions.checkMissing(this.optionGroups)
    if (missingErrors != null) {
      missingErrors.forEach((msg) => {
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
  async doRun (argv: string[]): Promise<number> {
    assert(false,
      'Abstract CliCmd.doRun(), redefine it in your derived class.')
  }

  /**
   * @summary Output command help
   *
   * @returns {undefined} Nothing.
   */
  help (): void {
    const help: CliHelp = new CliHelp(this.context)

    help.outputCommandLine(this.title, this.optionGroups)

    const commonOptionGroups: CliOptionGroup[] =
      CliOptions.getCommonOptionGroups()

    help.twoPassAlign(() => {
      this.doOutputHelpArgsDetails(help.multiPass)

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
   * @param {CliMultiPass} more Status for two pass.
   * @returns {undefined} Nothing.
   *
   * @description
   * The default implementation does nothing. Override it in
   * the application if needed.
   */
  doOutputHelpArgsDetails (more: CliMultiPass): void {
    // Nothing.
  }

  /**
   * @summary Convert a duration in ms to seconds if larger than 1000.
   * @param {number} millis Duration in milliseconds.
   * @returns {string} Value in ms or sec.
   */
  formatDuration (millis: number): string {
    if (millis < 1000) {
      return `${millis} ms`
    }
    return `${(millis / 1000).toFixed(3)} sec`
  }

  /**
   * @summary Display Done and the durations.
   * @returns {undefined} Nothing.
   */
  outputDoneDuration (): void {
    const log = this.log
    const context = this.context

    log.info()
    const durationString = this.formatDuration(Date.now() - context.startTime)
    const cmdDisplay = context.commands !== undefined
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
  makePathAbsolute (inPath: string): string {
    if (path.isAbsolute(inPath)) {
      return path.resolve(inPath)
    }
    /* eslint @typescript-eslint/strict-boolean-expressions: off */
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
  addGenerator (object: any): any { // TODO
    if (object.generators === undefined) {
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
    if (context.package.homepage !== undefined) {
      generator.homepage = context.package.homepage
    }

    object.generators.push(generator)

    return object
  }
}

// ----------------------------------------------------------------------------
