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

/**
 * Test the logger.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import { Console } from 'node:console'
import { Writable } from 'node:stream'

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

// ----------------------------------------------------------------------------

import { CliLogger } from '../../dist/index.js'

// ----------------------------------------------------------------------------

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

  clear () {
    this.stdout = ''
    this.stderr = ''
  }
}

// ----------------------------------------------------------------------------

test('mock console', (t) => {
  const mc = new MockConsole()
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')
  mc.console.log('output')
  t.equal(mc.stdout, 'output\n', 'stdout is output')
  t.equal(mc.stderr, '', 'stderr is empty')
  mc.console.error('error')
  t.equal(mc.stderr, 'error\n', 'stderr is error')

  t.end()
})

test('logger level', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console)
  t.equal(logger.level, 'info', 'default level')
  logger.level = 'trace'
  t.equal(logger.level, 'trace', 'set level')
  try {
    logger.level = 'xyz'
  } catch (err) {
    t.match(err.name, 'AssertionError', 'assert')
  }
  t.end()
})

test('logger level all', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'all')
  t.equal(logger.level, 'all', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, 'trace: trace\n', 'stdout is trace')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.debug('debug')
  t.equal(mc.stdout, 'debug: debug\n', 'stdout is debug')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.verbose('verbose')
  t.equal(mc.stdout, 'verbose\n', 'stdout is verbose')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'stdout is info')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.warn('warn')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'warning: warn\n', 'stderr is warn')

  mc.clear()
  logger.error('error')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'error: error\n', 'stderr is error')

  mc.clear()
  logger.output('output')
  t.equal(mc.stdout, 'output\n', 'stdout is output')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'stdout is always')
  t.equal(mc.stderr, '', 'stderr is empty')

  t.end()
})

test('logger level trace', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'trace')
  t.equal(logger.level, 'trace', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, 'trace: trace\n', 'stdout is trace')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.debug('debug')
  t.equal(mc.stdout, 'debug: debug\n', 'stdout is debug')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.verbose('verbose')
  t.equal(mc.stdout, 'verbose\n', 'stdout is verbose')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'stdout is info')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.warn('warn')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'warning: warn\n', 'stderr is warn')

  mc.clear()
  logger.error('error')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'error: error\n', 'stderr is error')

  mc.clear()
  logger.output('output')
  t.equal(mc.stdout, 'output\n', 'stdout is output')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'stdout is always')
  t.equal(mc.stderr, '', 'stderr is empty')

  t.end()
})

test('logger level debug', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'debug')
  t.equal(logger.level, 'debug', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.debug('debug')
  t.equal(mc.stdout, 'debug: debug\n', 'stdout is debug')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.verbose('verbose')
  t.equal(mc.stdout, 'verbose\n', 'stdout is verbose')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'stdout is info')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.warn('warn')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'warning: warn\n', 'stderr is warn')

  mc.clear()
  logger.error('error')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'error: error\n', 'stderr is error')

  mc.clear()
  logger.output('output')
  t.equal(mc.stdout, 'output\n', 'stdout is output')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'stdout is always')
  t.equal(mc.stderr, '', 'stderr is empty')

  t.end()
})

test('logger level verbose', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'verbose')
  t.equal(logger.level, 'verbose', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.debug('debug')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.verbose('verbose')
  t.equal(mc.stdout, 'verbose\n', 'stdout is verbose')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'stdout is info')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.warn('warn')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'warning: warn\n', 'stderr is warn')

  mc.clear()
  logger.error('error')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'error: error\n', 'stderr is error')

  mc.clear()
  logger.output('output')
  t.equal(mc.stdout, 'output\n', 'stdout is output')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'stdout is always')
  t.equal(mc.stderr, '', 'stderr is empty')

  t.end()
})

test('logger level info', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'info')
  t.equal(logger.level, 'info', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.debug('debug')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.verbose('verbose')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.info('info')
  t.equal(mc.stdout, 'info\n', 'stdout is info')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.warn('warn')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'warning: warn\n', 'stderr is warn')

  mc.clear()
  logger.error('error')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'error: error\n', 'stderr is error')

  mc.clear()
  logger.output('output')
  t.equal(mc.stdout, 'output\n', 'stdout is output')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'stdout is always')
  t.equal(mc.stderr, '', 'stderr is empty')

  t.end()
})

test('logger level warn', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'warn')
  t.equal(logger.level, 'warn', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.debug('debug')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.verbose('verbose')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.info('info')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.warn('warn')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'warning: warn\n', 'stderr is warn')

  mc.clear()
  logger.error('error')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'error: error\n', 'stderr is error')

  mc.clear()
  logger.output('output')
  t.equal(mc.stdout, 'output\n', 'stdout is output')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'stdout is always')
  t.equal(mc.stderr, '', 'stderr is empty')

  t.end()
})

test('logger level error', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'error')
  t.equal(logger.level, 'error', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.debug('debug')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.verbose('verbose')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.info('info')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.warn('warn')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.error('error')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, 'error: error\n', 'stderr is error')

  mc.clear()
  logger.output('output')
  t.equal(mc.stdout, 'output\n', 'stdout is output')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'stdout is always')
  t.equal(mc.stderr, '', 'stderr is empty')

  t.end()
})

test('logger level silent', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console, 'silent')
  t.equal(logger.level, 'silent', 'level')

  logger.trace('trace')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.debug('debug')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.verbose('verbose')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.info('info')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.warn('warn')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.error('error')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.output('output')
  t.equal(mc.stdout, '', 'stdout is empty')
  t.equal(mc.stderr, '', 'stderr is empty')

  mc.clear()
  logger.always('always')
  t.equal(mc.stdout, 'always\n', 'stdout is always')
  t.equal(mc.stderr, '', 'stderr is empty')

  t.end()
})

test('logger error exception', (t) => {
  const mc = new MockConsole()
  const logger = new CliLogger(mc.console)
  t.equal(logger.level, 'info', 'default level')
  logger.error(new Error('msg'))
  // console.log(mc.stderr)
  const errLines = mc.stderr.split(/\r?\n/)
  t.equal(errLines[0], 'Error: msg', 'stderr[0] is msg')
  t.match(errLines[1], 'at Test.', 'stderr[1] is at Test')

  t.end()
})

// ----------------------------------------------------------------------------
