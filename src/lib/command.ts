/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/license/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * This file provides the base class for application commands.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as path from 'node:path'
import * as util from 'node:util'

// ----------------------------------------------------------------------------

import { CommandNode } from './commands-tree.js'
import { Configuration } from './configuration.js'
import { Context } from './context.js'
import { ExitCodes } from './error.js'
import { Help, MultiPass } from './help.js'
import { formatDuration } from './utils.js'

// ----------------------------------------------------------------------------

export interface Generator {
  tool: string // Program name.
  version: string // Package semver.
  command: string[] // Full command.
  homepage?: string // Package homepage, if present.
  date: string // ISO date
}

// ============================================================================

export interface CommandConstructorParams {
  context: Context
}

/**
 * @summary Base class for a CLI application command.
 */
export abstract class Command {
  // --------------------------------------------------------------------------

  public context: Context

  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to remember the context.
   *
   * @param params Reference to an object with constructor parameters.
   */
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor (params: CommandConstructorParams) {
    assert(params)
    assert(params.context)

    this.context = params.context

    // ------------------------------------------------------------------------
    const context: Context = this.context

    const log = context.log
    log.trace('Command.constructor()')
  }

  /**
   * @summary Abstract `main()` method.
   *
   * @param argv Array of arguments.
   * @returns A promise resolving to the Exit code.
   */
  abstract main (argv: string[], forwardableArgv?: string[]): Promise<number>

  /**
   * @summary Execute the command.
   *
   * @param argv Array of arguments.
   * @returns Return code.
   */
  async prepareAndRun (params: {
    argv: string[]
  }): Promise<number> {
    assert(params)
    assert(params.argv)

    const context: Context = this.context

    const log = context.log
    log.trace('Command.prepareAndRun()')

    // Make a copy of the original args.
    context.unparsedArgv = [...params.argv]

    // Call the init() function of all defined options.
    context.options.initializeConfiguration()

    // Parse the args and return the remaining args, like package names.
    const remainingArgs: string[] = context.options.parse(params.argv)

    const config: Configuration = context.config
    log.trace(util.inspect(config))

    if (config.isHelpRequest !== undefined && config.isHelpRequest) {
      this.outputHelp()
      return ExitCodes.SUCCESS // Ok, command help explicitly called.
    }

    // Check if there are missing mandatory options.
    const missingErrors = context.options.checkMissingMandatory()
    if (missingErrors.length > 0) {
      missingErrors.forEach((msg) => {
        log.error(msg)
      })
      this.outputHelp()
      return ExitCodes.ERROR.SYNTAX // Error, missing mandatory option.
    }

    const { ownArgv, forwardableArgv } = this.splitForwardableArguments({
      argv: remainingArgs
    })

    const errorMessages = this.validateArgv({
      argv: ownArgv
    })

    if (errorMessages.length > 0) {
      errorMessages.forEach((message) => {
        log.error(message)
      })
      this.outputHelp()
      return ExitCodes.ERROR.SYNTAX
    }

    // Store them in the context, for just in case.
    context.ownArgv = ownArgv
    context.forwardableArgv = forwardableArgv

    // ------------------------------------------------------------------------

    let exitCode: number = ExitCodes.SUCCESS

    log.debug(`'${context.programName} ` +
      `${context.matchedCommands.join(' ')}' started`)

    exitCode = await this.main(ownArgv, forwardableArgv)

    log.debug(`'${context.programName} ` +
      `${context.matchedCommands.join(' ')}' - returned ${exitCode}`)

    return exitCode
  }

  /**
   * @summary Split arguments into own and forwardable.
   *
   * @param params.argv Array of strings with argument values.
   * @returns Two arrays of strings with own and forwardable argument values.
   *
   * @description
   * If the command explicitly enables `hasForwardableArguments`,
   * all arguments after `--` are passed as forwardable.
   */
  splitForwardableArguments (params: {
    argv: string[]
  }): {
      ownArgv: string[]
      forwardableArgv: string[]
    } {
    assert(params)
    assert(params.argv)

    const context: Context = this.context

    const ownArgv: string[] = []
    const forwardableArgv: string[] = []

    if (context.commandNode?.hasForwardableArguments ?? false) {
      let isOwn = true
      for (const arg of params.argv) {
        if (isOwn) {
          if (arg === '--') {
            // From now on, the following arguments will be stored
            // into the `forwardableArgv` array.
            isOwn = false
          } else {
            ownArgv.push(arg)
          }
        } else {
          // Subsequent '--' are passed through.
          forwardableArgv.push(arg)
        }
      }
    } else {
      // If there are no forwardable, all are stored into the `ownArgv`.
      ownArgv.push(...params.argv)
    }

    return { ownArgv, forwardableArgv }
  }

  /**
   * @summary Validate the argument values.
   *
   * @param params.argv Array of strings with argument values.
   * @returns Two arrays of strings with the valid arguments and
   *   possible error messages.
   */
  validateArgv (params: {
    argv: string[]
  }): string[] {
    assert(params)
    assert(params.argv)

    const context: Context = this.context

    assert(context.commandNode)
    const commandNode: CommandNode = context.commandNode

    const errorMessages = []

    if (commandNode.hasCustomOptions ||
      commandNode.hasCustomArgs) {
      for (const arg of params.argv) {
        if (arg.startsWith('-')) {
          if (commandNode.hasCustomOptions) {
            errorMessages.push(`Option '${arg}' not supported`)
          }
        } else {
          if (commandNode.hasCustomArgs) {
            errorMessages.push(`Argument '${arg}' not supported`)
          }
        }
      }
    }

    return errorMessages
  }

  /**
   * @summary Get the command title.
   * @returns A string
   *
   * @description
   * The title is displayed in the help output and
   * by some commands.
   */
  getHelpTitle (): string {
    assert(this.context.commandNode)
    return this.context.commandNode?.getHelpTitle()
  }

  /**
   * @summary Output command help
   *
   * @returns Nothing.
   */
  outputHelp (): void {
    const context: Context = this.context

    const log = context.log
    log.trace('Command.help()')

    const help: Help = new Help({ context })

    help.outputAll({
      object: this
    })
  }

  /**
   * @summary Output details about extra args.
   *
   * @param _multiPass Status for two pass.
   * @returns Nothing.
   *
   * @description
   * The default implementation does nothing. Override it in
   * the application if needed.
   */
  outputHelpArgsDetails (params: {
    multiPass: MultiPass
  }): void {
    assert(params)

    // Nothing.
  }

  /**
   * @summary Display Done and the durations.
   * @returns Nothing.
   */
  outputDoneDuration (): void {
    const context: Context = this.context

    const log = context.log

    log.info()
    const durationString =
      formatDuration(Date.now() - context.startTimestampMilliseconds)
    const commandParts =
      [context.programName, ...context.matchedCommands].join(' ')
    log.info(`'${commandParts}' completed in ${durationString}.`)
  }

  /**
   * @summary Make a path absolute.
   *
   * @param inPath A file or folder path.
   * @returns The absolute path.
   *
   * @description
   * If the path is already absolute, resolve it and return.
   * Otherwise, use the configuration CWD or the process CWD to
   * make the path absolute, resolve it and return.
   * To 'resolve' means to process possible `.` or `..` segments.
   */
  makePathAbsolute (inPath: string): string {
    const context: Context = this.context

    if (path.isAbsolute(inPath)) {
      return path.resolve(inPath)
    }
    return path.resolve(context.config.cwd ?? context.processCwd,
      inPath)
  }

  /**
   * @Summary Add a generator record to the destination object.
   *
   * @param object The destination object.
   * @returns The same object.
   *
   * @description
   * For traceability purposes, the command line used to invoke the
   * program is copied to the object, which will usually serialised
   * into a JSON.
   * Multiple generators are possible, each call will append a new
   * element to the array.
   */
  addGenerator (params: {
    object: any
  }): Generator {
    assert(params)

    assert(params.object)
    const object = params.object

    const context: Context = this.context

    if (object.generators === undefined) {
      const generators: Generator[] = []
      object.generators = generators
    }

    const generator: Generator = {
      tool: context.programName,
      version: context.packageJson.version,
      command: [context.programName, ...context.matchedCommands,
        ...context.unparsedArgv],
      date: (new Date()).toISOString()
    }

    if (context.packageJson.homepage !== undefined) {
      generator.homepage = context.packageJson.homepage
    }

    object.generators.push(generator)

    return object
  }
}

// ----------------------------------------------------------------------------

/**
 * @summary Type of derived command classes.
 *
 * @description
 * Explicit definition to show how a user Command class should look
 * like, more specifically that should it also set a mandatory title.
 *
 * It is also used to validate the call to instantiate the user class
 * in the Application class.
 */
export class DerivedCommand extends Command {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor (params: CommandConstructorParams) {
    super(params)
  }

  override async main (
    _argv: string[],
    _forwardableArgv: string[]
  ): Promise<number> {
    // ...
    return ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
