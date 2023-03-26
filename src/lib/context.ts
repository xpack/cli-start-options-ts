/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2023 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/license/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/@xpack/logger
import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import { Configuration } from './configuration.js'
import { Options } from './options.js'
import { getProgramName, NpmPackageJson } from './utils.js'

// ----------------------------------------------------------------------------

export class Context {
  // --------------------------------------------------------------------------

  /** Reference to an xPack Logger instance. */
  public log: Logger
  /** Reference to a node console. */
  public console: Console
  /** Reference to a configuration. */
  public config: Configuration

  public options: Options

  /** The invocation name of the program. */
  public programName: string

  public startTime: number

  public helpTitle: string

  public cmdPath: string
  public processCwd: string
  public processEnv: NodeJS.ProcessEnv
  public processArgv: string[]

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  public packageJson: NpmPackageJson = ({} as NpmPackageJson)

  /** The commands used to select the current class, in full form.
   * Set by the Application. */
  public matchedCommands: string[] = []

  /** All args, as received from main, excluding the commands. */
  public unparsedArgs: string[] = []

  /**
   * Arguments actually passed to the command run() method.
   * Options must have been processed by Options.parse();
   * if a `--` is encountered, everything else is also passed.
   */
  public actualArgs: string[] = []

  // --------------------------------------------------------------------------
  // External configuration variables, to be set in the derived constructor.

  // MUST be set to define the application root path.
  public rootPath: string | undefined = undefined

  // --------------------------------------------------------------------------

  /**
   * @summary Create a Context instance.
   * @param params
   *
   * For direct invocations, provide a way to define the environment.
   * Also useful in tests.
   */
  constructor (params: {
    log: Logger
    context?: Context
    programName?: string
    argv1?: string
    processCwd?: string
    processEnv?: NodeJS.ProcessEnv
    processArgv?: string[]
  }) {
    assert(params)

    assert(params.log, 'Mandatory log')
    this.log = params.log

    // REPL should always set the console to the REPL inout/output streams.
    this.console = this.log.console

    this.programName = params.programName ??
      params.context?.programName ??
      getProgramName()

    const argv1: string | undefined = params.argv1 ?? process.argv[1]
    assert(argv1 !== undefined, 'Mandatory argv[1]')

    this.cmdPath = argv1.trim()

    this.processCwd = params.processCwd ?? process.cwd()
    this.processEnv = params.processEnv ?? process.env
    this.processArgv = params.processArgv ?? process.argv

    // Normally this should have been passed in the constructor, but
    // for Application it is not available that early, since the rootPath
    // is known only after the instance is created.
    // Thus it must be set explicitly in Command/Application.
    this.helpTitle = ''

    this.startTime = Date.now()

    // Initialise the configuration.
    this.config = new Configuration()

    this.options = new Options({ context: this })

    if (params.context !== undefined) {
      // Copy the options & rootPath
      // from the application context.
      this.options.addGroups(params.context.options.groups)
      this.options.addGroups(params.context.options.commonGroups)
      this.rootPath = params.context.rootPath
      this.packageJson = params.context.packageJson
      this.matchedCommands = params.context.matchedCommands
    }
  }
}

// ----------------------------------------------------------------------------
