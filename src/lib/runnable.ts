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

// ----------------------------------------------------------------------------

import { Context } from './context.js'
import { MultiPass } from './help.js'
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

export interface RunnableConstructorParams {
  context: Context
}

export abstract class Runnable {
  // --------------------------------------------------------------------------

  public context: Context

  // --------------------------------------------------------------------------
  /**
   * @summary Constructor, to remember the context.
   *
   * @param params Reference to an object with constructor parameters.
   */
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor (params: RunnableConstructorParams) {
    assert(params)
    assert(params.context)

    this.context = params.context
  }

  /**
   * @summary Abstract `run()` method.
   *
   * @param argv Array of arguments.
   * @returns A promise resolving to the Exit code.
   */
  abstract run (argv: string[]): Promise<number>

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
