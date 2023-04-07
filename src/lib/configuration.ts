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

// import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/@xpack/logger
import { LogLevel } from '@xpack/logger'

// ----------------------------------------------------------------------------

// import { Context } from './context.js'

// ----------------------------------------------------------------------------

export const defaultLogLevel = 'info'

// ============================================================================

/**
 * @summary Class to store configuration variables.
 *
 * @description
 * An instance of this class is present in the `Context` object.
 *
 * The applications can extend this class with more variables.
 */
export class Configuration {
  /** Log level set via `--loglevel`. */
  public logLevel: LogLevel = defaultLogLevel

  /** Current working folder, set via `-C`. */
  public cwd: string = process.cwd()

  /** Help requested via `--help`. */
  public isHelpRequest: boolean = false

  /** Version requested via `--version`. */
  public isVersionRequest: boolean = false

  /** Disable the notifier via `--no-update-notifier`. */
  public noUpdateNotifier: boolean = false

  /** Server port number set via `--interactive-server-port`. */
  public interactiveServerPort: number | undefined = undefined

  // No explicit constructor needed, all members are already initialised.
  // constructor (_context: cli.Context) {
  // }
}

// ----------------------------------------------------------------------------
