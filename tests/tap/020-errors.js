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
 * Test custom errors.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

// ----------------------------------------------------------------------------

import {
  CliExitCodes,
  CliError,
  CliErrorSyntax,
  CliErrorApplication
} from '../../dist/index.js'

// ----------------------------------------------------------------------------

assert(CliExitCodes)
assert(CliError)
assert(CliErrorSyntax)
assert(CliErrorApplication)

// ----------------------------------------------------------------------------

test('types', (t) => {
  t.ok(Object.prototype.isPrototypeOf.call(Error, CliError),
    'CliError is Error')
  t.ok(Object.prototype.isPrototypeOf.call(Error, CliErrorSyntax),
    'CliErrorSyntax is Error')
  t.ok(Object.prototype.isPrototypeOf.call(Error, CliErrorApplication),
    'CliErrorApplication is Error')

  t.ok(CliExitCodes instanceof Object, 'CliExitCodes is Object')
  t.ok(CliExitCodes.ERROR instanceof Object, 'CliExitCodes.ERROR is Object')

  t.ok(!isNaN(CliExitCodes.SUCCESS), 'SUCCESS is a number')
  t.ok(!isNaN(CliExitCodes.ERROR.SYNTAX), 'ERROR.SYNTAX is a number')
  t.ok(!isNaN(CliExitCodes.ERROR.APPLICATION), 'ERROR.APPLICATION is a number')
  t.ok(!isNaN(CliExitCodes.ERROR.INPUT), 'ERROR.INPUT is a number')
  t.ok(!isNaN(CliExitCodes.ERROR.OUTPUT), 'ERROR.OUTPUT is a number')

  t.end()
})

test('exitCodes', (t) => {
  t.test('CliError', (t) => {
    try {
      throw new CliError('one')
    } catch (err) {
      t.equal(err.message, 'one', 'message is one')
      t.equal(err.exitCode, undefined, 'exit code is undefined')
    }
    try {
      throw new CliError('two', 7)
    } catch (err) {
      t.equal(err.message, 'two', 'message is two')
      t.equal(err.exitCode, 7, 'exit code is 7')
    }
    t.end()
  })

  t.test('CliErrorSyntax', (t) => {
    try {
      throw new CliErrorSyntax('one')
    } catch (err) {
      t.equal(err.message, 'one', 'message is one')
      t.equal(err.exitCode, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    }
    t.end()
  })

  t.test('CliErrorApplication', (t) => {
    try {
      throw new CliErrorApplication('one')
    } catch (err) {
      t.equal(err.message, 'one', 'message is one')
      t.equal(err.exitCode, CliExitCodes.ERROR.APPLICATION,
        'exit code is app')
    }
    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------
