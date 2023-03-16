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

// import { CliContext } from './cli-context.js'

// ----------------------------------------------------------------------------

const defaultLogLevel = 'info'

// ----------------------------------------------------------------------------

export class Configuration {
  logLevel: LogLevel = defaultLogLevel
  cwd: string = process.cwd()
  isHelpRequest: boolean = false
  isVersionRequest: boolean = false
  noUpdateNotifier: boolean = false

  interactiveServerPort: number | undefined = undefined

  // constructor (_context: CliContext) {
  //   // All members already initialised.
  // }
}

// ----------------------------------------------------------------------------
