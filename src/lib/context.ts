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
import { NpmPackageJson } from './utils.js'

// ----------------------------------------------------------------------------

export class Context {
  // --------------------------------------------------------------------------

  /** The invocation name of the program. */
  public programName: string
  /** Reference to a node console. */
  public console: Console
  /** Reference to an xPack Logger instance. */
  public log: Logger
  /** Reference to a configuration. */
  public config: Configuration

  public startTime: number

  public title: string

  public cmdPath: string
  public processCwd: string
  public processEnv: NodeJS.ProcessEnv
  public processArgv: string[]

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  public packageJson: NpmPackageJson = ({} as NpmPackageJson)

  public fullCommands: string[] = []

  // The commands used to select the current command.
  public commands: string[] = []

  // --------------------------------------------------------------------------
  // External configuration variables, to be set in the derived constructor.

  // MUST be set to define the application root path.
  public rootPath: string | undefined = undefined
  // MAY BE set, to enable REPL mode.
  public enableREPL: boolean = false
  // MAY BE set, to enable the update checker.
  public checkUpdatesIntervalSeconds: number = 0

  // --------------------------------------------------------------------------

  constructor (params: {
    programName: string
    console?: Console | undefined
    log?: Logger | undefined
    config?: Configuration | undefined
  }) {
    this.programName = params.programName

    // REPL should always set the console to the REPL inout/output streams.
    this.console = params.console ?? console
    assert(this.console, 'Mandatory console')

    this.log = params.log ?? new Logger({ console: this.console })
    assert(this.log, 'Mandatory log')

    const argv1 = process.argv[1]?.trim()
    assert(argv1 !== undefined, 'Mandatory argv[1]')

    this.cmdPath = argv1
    this.processCwd = process.cwd()
    this.processEnv = process.env
    this.processArgv = process.argv

    this.title = ''
    this.startTime = Date.now()

    // Initialise the configuration.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    this.config = params.config ?? new Configuration()
  }
}

// ----------------------------------------------------------------------------
