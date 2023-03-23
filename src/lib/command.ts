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

// import { strict as assert } from 'node:assert'
import * as path from 'node:path'
import * as util from 'node:util'

// ----------------------------------------------------------------------------

import { Configuration } from './configuration.js'
import { Context } from './context.js'
import { ExitCodes } from './error.js'
import { Help, MultiPass } from './help.js'
import { Runnable, RunnableConstructorParams } from './runnable.js'
import { formatDuration } from './utils.js'

// ============================================================================

export interface Generator {
  tool: string // Program name.
  version: string // Package semver.
  command: string[] // Full command.
  homepage?: string // Package homepage, if present.
  date: string // ISO date
}

// ----------------------------------------------------------------------------

export interface CommandConstructorParams extends RunnableConstructorParams {
}

/**
 * @classdesc
 * Base class for a CLI application command.
 */
export abstract class Command extends Runnable {
  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to remember the context.
   *
   * @param params Reference to an object with constructor parameters.
   */
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor (params: CommandConstructorParams) {
    super(params)

    const context: Context = this.context

    const log = context.log
    log.trace(`${this.constructor.name}.constructor()`)
  }

  /**
   * @summary Execute the command.
   *
   * @param argv Array of arguments.
   * @returns Return code.
   */
  async prepareAndRun (argv: string[]): Promise<number> {
    const context: Context = this.context

    const log = context.log
    log.trace(`${this.constructor.name}.run()`)

    // Make a copy of the original args.
    context.unparsedArgs = [...argv]

    // Call the init() function of all defined options.
    context.options.initializeConfiguration()

    // Parse the args and return the remaining args, like package names.
    const remainingArgs: string[] = context.options.parse(argv)

    const config: Configuration = context.config
    log.trace(util.inspect(config))

    if (config.isHelpRequest !== undefined && config.isHelpRequest) {
      this.outputHelp()
      return ExitCodes.SUCCESS // Ok, command help explicitly called.
    }

    // Check if there are missing mandatory options.
    const missingErrors = context.options.checkMissingMandatory()
    if (missingErrors != null) {
      missingErrors.forEach((msg) => {
        log.error(msg)
      })
      this.outputHelp()
      return ExitCodes.ERROR.SYNTAX // Error, missing mandatory option.
    }

    const actualArgs: string[] = []

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
            actualArgs.push(arg)
          }
        }
      }
      for (; i < remainingArgs.length; ++i) {
        const arg = remainingArgs[i]
        if (arg !== undefined) {
          actualArgs.push(arg)
        }
      }
    }

    context.actualArgs = actualArgs

    return await this.run(actualArgs)
  }

  /**
   * @summary Output command help
   *
   * @returns Nothing.
   */
  outputHelp (): void {
    const context: Context = this.context

    const log = context.log
    log.trace(`${this.constructor.name}.help()`)

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
  outputHelpArgsDetails (_multiPass: MultiPass): void {
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
    const durationString = formatDuration(Date.now() - context.startTime)
    const cmdDisplay = context.fullCommands.length > 0
      ? context.programName + context.fullCommands.join(' ')
      : context.programName
    log.info(`'${cmdDisplay}' completed in ${durationString}.`)
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
  addGenerator (object: any): Generator { // TODO
    const context: Context = this.context

    if (object.generators === undefined) {
      const generators: Generator[] = []
      object.generators = generators
    }

    const generator: Generator = {
      tool: context.programName,
      version: context.packageJson.version,
      command: [context.programName, ...context.fullCommands,
        ...context.unparsedArgs],
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
  constructor (params: CommandConstructorParams) {
    super(params)

    const context: Context = this.context

    context.title = '...'
  }

  override async run (
    _argv: string[]
  ): Promise<number> {
    // ...
    return ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------
