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

const numLevel = {
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
  private readonly _console: Console
  private _level: string
  private _numLevel: number

  // --------------------------------------------------------------------------

  /**
   * @summary Create a logger instance for a given console.
   *
   * @param {Object} console_ Reference to console.
   * @param {string} level_ A log level.
   */
  constructor (console_, level_ = 'info') {
    assert(console)
    assert(level_ in numLevel)

    this._console = console_
    // Use the setter, to also set numLevel.
    this.level = level_
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
  always (msg = '', ...args): void {
    this._console.log(msg, ...args)
  }

  error (msg: any = '', ...args): void {
    if (this._numLevel >= numLevel.error) {
      if (msg instanceof Error) {
        this._console.error(msg, ...args)
      } else {
        this._console.error('error: ' + (msg as string), ...args)
      }
    }
  }

  output (msg = '', ...args): void {
    if (this._numLevel >= numLevel.error) {
      this._console.log(msg, ...args)
    }
  }

  warn (msg = '', ...args): void {
    if (this._numLevel >= numLevel.warn) {
      this._console.error('warning: ' + msg, ...args)
    }
  }

  info (msg = '', ...args): void {
    if (this._numLevel >= numLevel.info) {
      this._console.log(msg, ...args)
    }
  }

  verbose (msg = '', ...args): void {
    if (this._numLevel >= numLevel.verbose) {
      this._console.log(msg, ...args)
    }
  }

  debug (msg = '', ...args): void {
    if (this._numLevel >= numLevel.debug) {
      this._console.log('debug: ' + msg, ...args)
    }
  }

  trace (msg = '', ...args): void {
    if (this._numLevel >= numLevel.trace) {
      this._console.log('trace: ' + msg, ...args)
    }
  }

  set level (level_: string) {
    assert(numLevel[level_] !== undefined,
      `Log level '${level_}' not supported.`)

    this._numLevel = numLevel[level_]
    this._level = level_
  }

  get level (): string {
    return this._level
  }

  isWarn (): boolean {
    return this._numLevel >= numLevel.warn
  }

  isInfo (): boolean {
    return this._numLevel >= numLevel.info
  }

  isVerbose (): boolean {
    return this._numLevel >= numLevel.verbose
  }

  isDebug (): boolean {
    return this._numLevel >= numLevel.debug
  }

  isTrace (): boolean {
    return this._numLevel >= numLevel.trace
  }
}

// ----------------------------------------------------------------------------
