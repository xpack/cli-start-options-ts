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

  public title: string

  public cmdPath: string
  public processCwd: string
  public processEnv: NodeJS.ProcessEnv
  public processArgv: string[]

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  public packageJson: NpmPackageJson = ({} as NpmPackageJson)

  /** The commands used to select the current class, in full form.
   * Set by the Application. */
  public fullCommands: string[] = []

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

  constructor (params: {
    log: Logger
  }) {
    assert(params)

    assert(params.log, 'Mandatory log')
    this.log = params.log

    // REPL should always set the console to the REPL inout/output streams.
    this.console = this.log.console

    this.programName = getProgramName()

    const argv1 = process.argv[1]?.trim()
    assert(argv1 !== undefined, 'Mandatory argv[1]')

    this.cmdPath = argv1
    this.processCwd = process.cwd()
    this.processEnv = process.env
    this.processArgv = process.argv

    // Normally this should have been passed in the constructor, but
    // for Application it is not available that early, since the rootPath
    // is known only after the instance is created.
    // Thus it must be set explicitly in Command/Application.
    this.title = '(unset)'
    this.startTime = Date.now()

    // Initialise the configuration.
    this.config = new Configuration()

    this.options = new Options({ context: this })
  }
}

// ----------------------------------------------------------------------------
