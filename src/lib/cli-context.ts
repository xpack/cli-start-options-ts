/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2023 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/MIT/.
 */

/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

import { CliLogger } from './cli-logger.js'

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
}

export interface CliConfig {
  logLevel: string
  cwd: string
  // Optional
  isHelpRequest?: boolean
  isInteractive?: boolean
  interactiveServerPort?: number
  invokedFromCli?: boolean
  isVersionRequest?: boolean
  noUpdateNotifier?: boolean
}

export interface CliContext {
  log: CliLogger
  programName: string
  // TODO: rename packageJson
  package: NpmPackageJson
  rootPath: string
  fullCommands: string[]
  config: CliConfig
  processCwd: string
  startTime: number
  commands: string[]
  console: Console
  cmdPath: string
  processEnv: NodeJS.ProcessEnv
  processArgv: string[]
}

// ----------------------------------------------------------------------------
