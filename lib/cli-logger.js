/*
 * This file is part of the xPack distribution
 *   (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom
 * the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict'
/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * This file implements a simple CLI logger.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')

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

// export
class CliLogger {
  // --------------------------------------------------------------------------

  constructor (console_, level_ = 'warn') {
    this._console = console_
    this.level = level_
  }

  error (msg, ...args) {
    if (this._numLevel >= numLevel.error) {
      this._console.error('ERROR: ' + msg, ...args)
    }
  }

  warn (msg, ...args) {
    if (this._numLevel >= numLevel.warn) {
      this._console.error('WARN: ' + msg, ...args)
    }
  }

  info (msg, ...args) {
    if (this._numLevel >= numLevel.info) {
      this._console.log(msg, ...args)
    }
  }

  verbose (msg, ...args) {
    if (this._numLevel >= numLevel.verbose) {
      this._console.log(msg, ...args)
    }
  }

  debug (msg, ...args) {
    if (this._numLevel >= numLevel.debug) {
      this._console.log('DEBUG: ' + msg, ...args)
    }
  }

  trace (msg, ...args) {
    if (this._numLevel >= numLevel.trace) {
      this._console.log('TRACE: ' + msg, ...args)
    }
  }

  set level (level_) {
    assert(numLevel[level_] !== undefined,
      `Log level '${level_}' not supported.`)

    this._numLevel = numLevel[level_]
    this._level = level_
  }

  get level () {
    return this._level
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The CliLogger class is added as a property of this object.
module.exports.CliLogger = CliLogger

// In ES6, it would be:
// export class CliLogger { ... }
// ...
// import { CliLogger } from 'cli-logger.js'

// ----------------------------------------------------------------------------
