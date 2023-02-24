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

// https://www.npmjs.com/package/@xpack/logger
import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import { CliContext, CliConfig } from './cli-context.js'
import { CliExitCodes } from './cli-error.js'
import { CliHelp, CliMultiPass } from './cli-help.js'
import { CliOptions, CliOptionGroup } from './cli-options.js'

// ============================================================================

export interface CliGenerator {
  tool: string // Program name.
  version: string // Package semver.
  command: string[] // Full command.
  homepage?: string // Package homepage, if present.
  date: string // ISO date
}

// ----------------------------------------------------------------------------

/**
 * @classdesc
 * Base class for a CLI application command.
 */
export class CliCommand {
  // --------------------------------------------------------------------------

  public context: CliContext
  public log: Logger
  public commands: string
  public title: string
  public optionGroups: CliOptionGroup[]

  // All args, as received from CliCommand.
  public unparsedArgs: string[] = []
  public commandArgs: string[] = []

  /**
   * @summary Constructor, to remember the context.
   *
   * @param {Object} context Reference to a context.
   * @param {string} title The command one line description.
   * @param {CliOptionGroup[]} optionGroups Array of option groups.
   */
  constructor (
    context: CliContext,
    title?: string,
    optionGroups?: CliOptionGroup[]
  ) {
    assert(context)
    assert(context.log)
    // assert(context.fullCommands)

    this.context = context
    this.log = context.log
    this.commands = context.fullCommands.join(' ')
    this.title = title ?? '(title not set)'
    this.optionGroups = optionGroups ?? []
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

    // Remember the original args.
    this.unparsedArgs = args

    // Parse the args and return the remaining args, like package names.
    const remainingArgs: string[] = CliOptions.parseOptions(args, context,
      this.optionGroups)

    if (config.isHelpRequest !== undefined && config.isHelpRequest) {
      this.help()
      return CliExitCodes.SUCCESS // Ok, command help explicitly called.
    }

    const commandArgs: string[] = []

    if (remainingArgs.length > 0) {
      let i = 0
      for (; i < remainingArgs.length; ++i) {
        const arg = remainingArgs[i]
        if (arg !== undefined) {
          if (arg === '--') {
            break
          }
          if (arg.startsWith('-')) {
            log.warn(`Option '${arg}' not supported; ignored`)
          } else {
            commandArgs.push(arg)
          }
        }
      }
      for (; i < remainingArgs.length; ++i) {
        const arg = remainingArgs[i]
        if (arg !== undefined) {
          commandArgs.push(arg)
        }
      }
    }

    // Check if there are missing mandatory options.
    const missingErrors = CliOptions.checkMissingMandatory(this.optionGroups)
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
   * @param {string[]} _argv Array of arguments.
   * @returns {number} Return code.
   */
  async doRun (
    _argv: string[] // Unused
  ): Promise<number> {
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
   * @param {CliMultiPass} _multiPass Status for two pass.
   * @returns {undefined} Nothing.
   *
   * @description
   * The default implementation does nothing. Override it in
   * the application if needed.
   */
  doOutputHelpArgsDetails (_multiPass: CliMultiPass): void {
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
    return path.resolve(this.context.config.cwd ?? this.context.processCwd,
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
  addGenerator (object: any): CliGenerator { // TODO
    if (object.generators === undefined) {
      const generators: CliGenerator[] = []
      object.generators = generators
    }

    const context = this.context
    const generator: CliGenerator = {
      tool: context.programName,
      version: context.package.version,
      command: [context.programName].concat(this.commands, this.unparsedArgs),
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
