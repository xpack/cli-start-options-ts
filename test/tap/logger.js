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

/**
 * Test the logger.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')
const Writable = require('stream').Writable
const Console = require('console').Console

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const CliLogger = require('../../index.js').CliLogger

assert(CliLogger, 'CliLogger')

// ============================================================================

class MockConsole {
  constructor () {
    this.stdout = ''
    this.ostream = new Writable({
      write: (chunk, encoding, callback) => {
        this.stdout += chunk.toString()
        callback()
      }
    })

    this.stderr = ''
    this.errstream = new Writable({
      write: (chunk, encoding, callback) => {
        this.stderr += chunk.toString()
        callback()
      }
    })
    this.console = new Console(this.ostream, this.errstream)
  }
}

// ----------------------------------------------------------------------------

test('mock console', (t) => {
  const mc = new MockConsole()
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')
  mc.console.log('output')
  t.equal(mc.stdout, 'output\n', 'msg stdout')
  t.equal(mc.stderr, '', 'empty stderr')
  mc.console.error('error')
  t.equal(mc.stderr, 'error\n', 'msg stderr')

  t.end()
})

test('logger level', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console)
  t.equal(logger.level, 'warn', 'default level')
  logger.level = 'trace'
  t.equal(logger.level, 'trace', 'set level')
  try {
    logger.level = 'xyz'
  } catch (err) {
    t.equal(err.name, 'AssertionError', 'assert')
  }
  t.end()
})

test('logger level all', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'all')
  t.equal(logger.level, 'all', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, 'TRACE: trace\n', 'trace stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.debug('debug')
  t.equal(mc.stdout, 'DEBUG: debug\n', 'debug stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.verbose('verbose')
  t.equal(mc.stdout, 'verbose\n', 'verbose stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'info stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.warn('warn')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'WARN: warn\n', 'warn stderr')

  mc.stderr = ''
  logger.error('error')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'ERROR: error\n', 'error stderr')

  mc.stderr = ''
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'always stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  t.end()
})

test('logger level trace', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'trace')
  t.equal(logger.level, 'trace', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, 'TRACE: trace\n', 'trace stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.debug('debug')
  t.equal(mc.stdout, 'DEBUG: debug\n', 'debug stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.verbose('verbose')
  t.equal(mc.stdout, 'verbose\n', 'verbose stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'info stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.warn('warn')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'WARN: warn\n', 'warn stderr')

  mc.stderr = ''
  logger.error('error')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'ERROR: error\n', 'error stderr')

  mc.stderr = ''
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'always stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  t.end()
})

test('logger level debug', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'debug')
  t.equal(logger.level, 'debug', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.debug('debug')
  t.equal(mc.stdout, 'DEBUG: debug\n', 'debug stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.verbose('verbose')
  t.equal(mc.stdout, 'verbose\n', 'verbose stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'info stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.warn('warn')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'WARN: warn\n', 'warn stderr')

  mc.stderr = ''
  logger.error('error')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'ERROR: error\n', 'error stderr')

  mc.stderr = ''
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'always stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  t.end()
})

test('logger level verbose', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'verbose')
  t.equal(logger.level, 'verbose', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.debug('debug')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.verbose('verbose')
  t.equal(mc.stdout, 'verbose\n', 'verbose stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'info stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.warn('warn')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'WARN: warn\n', 'warn stderr')

  mc.stderr = ''
  logger.error('error')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'ERROR: error\n', 'error stderr')

  mc.stderr = ''
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'always stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  t.end()
})

test('logger level info', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'info')
  t.equal(logger.level, 'info', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.debug('debug')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.verbose('verbose')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'info stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.warn('warn')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'WARN: warn\n', 'warn stderr')

  mc.stderr = ''
  logger.error('error')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'ERROR: error\n', 'error stderr')

  mc.stderr = ''
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'always stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  t.end()
})

test('logger level warn', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'warn')
  t.equal(logger.level, 'warn', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.debug('debug')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.verbose('verbose')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.info('info')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.warn('warn')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'WARN: warn\n', 'warn stderr')

  mc.stderr = ''
  logger.error('error')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'ERROR: error\n', 'error stderr')

  mc.stderr = ''
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'always stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  t.end()
})

test('logger level error', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'error')
  t.equal(logger.level, 'error', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.debug('debug')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.verbose('verbose')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.info('info')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.warn('warn')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stderr = ''
  logger.error('error')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, 'ERROR: error\n', 'error stderr')

  mc.stderr = ''
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'always stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  t.end()
})

test('logger level silent', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'silent')
  t.equal(logger.level, 'silent', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.debug('debug')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.verbose('verbose')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.info('info')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stdout = ''
  logger.warn('warn')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stderr = ''
  logger.error('error')
  t.equal(mc.stdout, '', 'empty stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  mc.stderr = ''
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'always stdout')
  t.equal(mc.stderr, '', 'empty stderr')

  t.end()
})

test('logger error exception', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console)
  t.equal(logger.level, 'warn', 'default level')
  logger.error(new Error('msg'))
  // console.log(mc.stderr)
  const errLines = mc.stderr.split(/\r?\n/)
  t.equal(errLines[0], 'Error: msg', 'msg error')
  t.match(errLines[1], 'at Test.test', 'at Test')

  t.end()
})

// ----------------------------------------------------------------------------
