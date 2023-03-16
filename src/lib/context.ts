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

// ----------------------------------------------------------------------------

export interface NpmPackageJson {
  name: string
  version: string
  description?: string
  homepage?: string
  bugs?: {
    url?: string
  }
  author?: string | {
    name?: string
    email?: string
    url?: string
  }
  engines?: {
    node?: string
  }
}

export class Context {
  // --------------------------------------------------------------------------

  /** The invocation name of the program. */
  programName: string
  /** Reference to a node console. */
  console: Console
  /** Reference to an xPack Logger instance. */
  log: Logger
  /** Reference to a configuration. */
  config: Configuration
  cmdPath: string
  processCwd: string
  processEnv: NodeJS.ProcessEnv
  processArgv: string[]
  startTime: number

  // TODO: rename packageJson
  // Set in initialize().
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  packageJson: NpmPackageJson = ({} as NpmPackageJson)

  fullCommands: string[] = []

  // The commands used to select the current command.
  commands: string[] = []
  // The class implementing the current command.
  CommandClass: any | undefined = undefined
  commandInstance: any | undefined = undefined

  // --------------------------------------------------------------------------
  // External configuration variables, to be set in the derived constructor.

  // MUST be set to define the application root path.
  rootPath: string | undefined = undefined
  // MAY BE set, to enable REPL mode.
  enableREPL: boolean = false
  // MAY BE set, to enable the update checker.
  checkUpdatesIntervalSeconds: number = 0

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

    this.startTime = Date.now()

    // Initialise the configuration.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    this.config = params.config ?? new Configuration()

    Options.initialise(this)
  }
}

// ----------------------------------------------------------------------------
