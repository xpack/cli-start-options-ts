/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
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

/*
 * This file implements a simple CLI logger.
 *
 * Use `log.always()` instead of the `console.log()`, since it accounts for
 * different contexts, created for instance when using REPL.
 *
 * The messages may include formatting directives, with additional
 * arguments, as defined by the Node.js console (not really necessary
 * with ES6).
 *
 * There is no `critical` level, corresponding to errors that prevent
 * the program to run, since these are actually related to bugs;
 * use `assert()` instead.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ============================================================================

export type CliLogLevel =
  'silent' | 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'trace' | 'all'

const numericLevels = {
  silent: -Infinity,
  error: 10,
  warn: 20,
  info: 30,
  verbose: 40,
  debug: 50,
  trace: 60,
  all: Infinity
}

export class CliLogger {
  private readonly console: Console
  private stringLevel: CliLogLevel
  private numericLevel: number = 0

  // --------------------------------------------------------------------------

  /**
   * @summary Create a logger instance for a given console.
   *
   * @param {Object} console Reference to console.
   * @param {string} level A log level.
   */
  constructor (console: Console, level: CliLogLevel = 'info') {
    assert(console)
    assert(level in numericLevels)

    this.console = console
    // Use the setter, to also set numLevel.
    this.stringLevel = level
    this.level = level
  }

  /**
   * @summary Output always.
   *
   * @param {string} msg Message.
   * @param {*} args Possible arguments.
   * @returns {undefined} Nothing.
   *
   * @description
   * The message is always passed to the console, regardless the
   * log level.
   *
   * Use this instead of console.log(), which in Node.js always
   * refers to the process console, not the possible REPL streams.
   */
  always (msg: any = '', ...args: any[]): void {
    this.console.log(msg, ...args)
  }

  error (msg: any = '', ...args: any[]): void {
    if (this.numericLevel >= numericLevels.error) {
      if (msg instanceof Error) {
        this.console.error(msg, ...args)
      } else {
        this.console.error('error: ' + (msg as string), ...args)
      }
    }
  }

  output (msg: any = '', ...args: any[]): void {
    if (this.numericLevel >= numericLevels.error) {
      this.console.log(msg, ...args)
    }
  }

  warn (msg: string = '', ...args: any[]): void {
    if (this.numericLevel >= numericLevels.warn) {
      this.console.error('warning: ' + msg, ...args)
    }
  }

  info (msg: any = '', ...args: any[]): void {
    if (this.numericLevel >= numericLevels.info) {
      this.console.log(msg, ...args)
    }
  }

  verbose (msg: any = '', ...args: any[]): void {
    if (this.numericLevel >= numericLevels.verbose) {
      this.console.log(msg, ...args)
    }
  }

  debug (msg: string = '', ...args: any[]): void {
    if (this.numericLevel >= numericLevels.debug) {
      this.console.log('debug: ' + msg, ...args)
    }
  }

  trace (msg: string = '', ...args: any[]): void {
    if (this.numericLevel >= numericLevels.trace) {
      this.console.log('trace: ' + msg, ...args)
    }
  }

  set level (level: CliLogLevel) {
    assert(numericLevels[level] !== undefined,
      `Log level '${level}' not supported.`)

    this.numericLevel = numericLevels[level]
    this.stringLevel = level
  }

  get level (): CliLogLevel {
    return this.stringLevel
  }

  isWarn (): boolean {
    return this.numericLevel >= numericLevels.warn
  }

  isInfo (): boolean {
    return this.numericLevel >= numericLevels.info
  }

  isVerbose (): boolean {
    return this.numericLevel >= numericLevels.verbose
  }

  isDebug (): boolean {
    return this.numericLevel >= numericLevels.debug
  }

  isTrace (): boolean {
    return this.numericLevel >= numericLevels.trace
  }
}

// ----------------------------------------------------------------------------
