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

import { Application } from './application.js'
import { Context } from './context.js'
import { ExitCodes } from './error.js'
import { Help, MultiPass } from './help.js'
import { Options } from './options.js'
import { Configuration } from './configuration.js'
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

/**
 * @classdesc
 * Base class for a CLI application command.
 */
export class Command {
  // --------------------------------------------------------------------------

  public application: Application
  public context: Context
  public log: Logger
  public commands: string
  public title: string
  public options: Options

  // All args, as received from cli.Command.
  public unparsedArgs: string[] = []
  public commandArgs: string[] = []

  /**
   * @summary Constructor, to remember the context.
   *
   * @param application Reference to an Application.
   * @param title The command one line description.
   */
  constructor (params: {
    application: Application
    title: string
  }) {
    assert(params.application)
    this.application = params.application

    assert(this.application.context)
    this.context = this.application.context

    assert(this.context.log)
    this.log = this.context.log

    const { context } = this
    this.commands = context.fullCommands.join(' ')

    this.title = params.title

    this.options = new Options({
      context,
      optionsGroups: this.application.options.groups
    })
  }

  /**
   * @summary Execute the command.
   *
   * @param argv Array of arguments.
   * @returns Return code.
   */
  async prepareAndRun (argv: string[]): Promise<number> {
    const log = this.log
    log.trace(`${this.constructor.name}.run()`)

    const context: Context = this.context
    const config: Configuration = context.config

    // Remember the original args.
    this.unparsedArgs = argv

    // Call the init() function of all defined options.
    this.options.initializeConfiguration()

    // Parse the args and return the remaining args, like package names.
    const remainingArgs: string[] = this.options.parse(argv)

    log.trace(util.inspect(config))

    if (config.isHelpRequest !== undefined && config.isHelpRequest) {
      this.outputHelp()
      return ExitCodes.SUCCESS // Ok, command help explicitly called.
    }

    // Check if there are missing mandatory options.
    const missingErrors = this.options.checkMissingMandatory()
    if (missingErrors != null) {
      missingErrors.forEach((msg) => {
        log.error(msg)
      })
      this.outputHelp()
      return ExitCodes.ERROR.SYNTAX // Error, missing mandatory option.
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

    this.commandArgs = commandArgs

    return await this.run(commandArgs)
  }

  /**
   * @summary Kind of abstract `run()` method.
   *
   * @param _argv Array of arguments.
   * @returns Exit code.
   */
  async run (
    _argv: string[] // Unused
  ): Promise<number> {
    assert(false,
      'Define a run() method in the cli.Command derived class.')
  }

  /**
   * @summary Output command help
   *
   * @returns Nothing.
   */
  outputHelp (): void {
    const context = this.context

    const log = context.log
    log.trace(`${this.constructor.name}.help()`)

    const help: Help = new Help({ context, options: this.options })

    help.outputAll({
      object: this,
      title: this.title,
      isCommand: true
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
    const log = this.log
    const context = this.context

    log.info()
    const durationString = formatDuration(Date.now() - context.startTime)
    const cmdDisplay = context.commands !== undefined
      ? [context.programName].concat(context.commands).join(' ')
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
    if (path.isAbsolute(inPath)) {
      return path.resolve(inPath)
    }
    return path.resolve(this.context.config.cwd ?? this.context.processCwd,
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
    if (object.generators === undefined) {
      const generators: Generator[] = []
      object.generators = generators
    }

    const context = this.context
    const generator: Generator = {
      tool: context.programName,
      version: context.packageJson.version,
      command: [context.programName].concat(this.commands, this.unparsedArgs),
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
