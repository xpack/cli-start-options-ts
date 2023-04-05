/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * Test custom errors.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.ExitCodes)
assert(cli.Error)
assert(cli.SyntaxError)
assert(cli.ApplicationError)

// ----------------------------------------------------------------------------

await test('types', (t) => {
  t.ok(Object.prototype.isPrototypeOf.call(Error, cli.Error),
    'CliError is Error')
  t.ok(Object.prototype.isPrototypeOf.call(Error, cli.SyntaxError),
    'CliErrorSyntax is Error')
  t.ok(Object.prototype.isPrototypeOf.call(Error, cli.ApplicationError),
    'CliErrorApplication is Error')

  t.ok(cli.ExitCodes instanceof Object, 'CliExitCodes is Object')
  t.ok(cli.ExitCodes.ERROR instanceof Object, 'CliExitCodes.ERROR is Object')

  t.ok(!isNaN(cli.ExitCodes.SUCCESS), 'SUCCESS is a number')
  t.ok(!isNaN(cli.ExitCodes.ERROR.SYNTAX), 'ERROR.SYNTAX is a number')
  t.ok(!isNaN(cli.ExitCodes.ERROR.APPLICATION), 'ERROR.APPLICATION is a number')
  t.ok(!isNaN(cli.ExitCodes.ERROR.INPUT), 'ERROR.INPUT is a number')
  t.ok(!isNaN(cli.ExitCodes.ERROR.OUTPUT), 'ERROR.OUTPUT is a number')

  t.end()
})

await test('exitCodes', async (t) => {
  await t.test('CliError', (t) => {
    try {
      throw new cli.Error('one')
    } catch (err: any) {
      t.equal(err.message, 'one', 'message is one')
      t.equal(err.exitCode, cli.ERROR.APPLICATION, 'exit code is APPLICATION')
    }
    try {
      throw new cli.Error('two', 7)
    } catch (err: any) {
      t.equal(err.message, 'two', 'message is two')
      t.equal(err.exitCode, 7, 'exit code is 7')
    }
    t.end()
  })

  await t.test('CliErrorSyntax', (t) => {
    try {
      throw new cli.SyntaxError('one')
    } catch (err: any) {
      t.equal(err.message, 'one', 'message is one')
      t.equal(err.exitCode, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    }
    t.end()
  })

  await t.test('CliErrorApplication', (t) => {
    try {
      throw new cli.ApplicationError('one')
    } catch (err: any) {
      t.equal(err.message, 'one', 'message is one')
      t.equal(err.exitCode, cli.ExitCodes.ERROR.APPLICATION,
        'exit code is app')
    }
    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------
