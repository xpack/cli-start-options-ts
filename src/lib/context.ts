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
import { CommandNode } from './commands-tree.js'
import { Help } from './help.js'
import { Options } from './options.js'
import { getProgramName, NpmPackageJson } from './utils.js'

// ============================================================================

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

  public startTimestampMilliseconds: number

  public cmdPath: string
  public processCwd: string
  public processEnv: NodeJS.ProcessEnv
  public processArgv: string[]

  public packageJson: NpmPackageJson

  /** The commands used to select the current class, in full form.
   * Set by the Application. */
  public matchedCommands: string[] = []

  /** All argument values, as received from the caller,
   * excluding the commands. */
  public unparsedArgv: string[] = []

  /**
   * Arguments actually passed to the command `main()` method.
   * Options must have been processed by `Options.parse()`;
   * if a `--` is encountered, the remaining arguments
   * are passed via `forwardableArgv`.`
   */
  public ownArgv: string[] = []
  /**
   * Arguments after a `--`, if any.
   */
  public forwardableArgv: string[] = []

  /**
   * Reference to a command node, either the root tree node, or
   * a specific command/sub-command node.
   */
  public commandNode: CommandNode | undefined

  public help: Help | undefined = undefined

  // --------------------------------------------------------------------------
  // External configuration variables, to be set in the derived constructor.

  /**
   * The absolute path of the project root folder, where the
   * `package.json` file is located.
   *
   * MUST be set by the application derived class.
   */
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
    processCwd?: string
    processEnv?: NodeJS.ProcessEnv
    processArgv?: string[]
    packageJson?: NpmPackageJson
  }) {
    assert(params)

    assert(params.log, 'Mandatory log')
    this.log = params.log

    // REPL should always set the console to the REPL inout/output streams.
    this.console = this.log.console

    this.processCwd = params.processCwd ??
      params.context?.processCwd ?? process.cwd()
    this.processEnv = params.processEnv ??
      params.context?.processEnv ?? process.env
    this.processArgv = params.processArgv ??
      params.context?.processArgv ?? process.argv

    // `process.argv[1]` - the full path of the invoking script.
    const argv1: string | undefined = this.processArgv[1]
    assert(argv1 !== undefined, 'Mandatory argv[1]')

    this.cmdPath = argv1.trim()

    this.programName = params.programName ??
    params.context?.programName ??
    getProgramName(this.cmdPath)

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    this.packageJson = params.packageJson ?? ({} as NpmPackageJson)

    this.startTimestampMilliseconds = Date.now()

    // Initialise the configuration.
    this.config = new Configuration()

    this.options = new Options({ context: this })

    if (params.context !== undefined) {
      // Copy the options from the application context.
      this.options.addGroups(params.context.options.groups)
      this.options.addGroups(params.context.options.commonGroups)

      // Copy other properties from the application context.
      this.rootPath = params.context.rootPath
      this.packageJson = params.context.packageJson
      this.matchedCommands = params.context.matchedCommands
    }
  }
}

// ----------------------------------------------------------------------------
