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
 * Test custom errors.
 */

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const CliExitCodes = require('../../index.js').CliExitCodes
const CliError = require('../../index.js').CliError
const CliErrorSyntax = require('../../index.js').CliErrorSyntax
const CliErrorApplication = require('../../index.js').CliErrorApplication

// ----------------------------------------------------------------------------

test('types', (t) => {
  t.ok(Error.isPrototypeOf(CliError), 'CliError')
  t.ok(Error.isPrototypeOf(CliErrorSyntax), 'CliErrorSyntax')
  t.ok(Error.isPrototypeOf(CliErrorApplication), 'CliErrorApplication')

  t.ok(CliExitCodes instanceof Object, 'CliExitCodes')
  t.ok(CliExitCodes.ERROR instanceof Object, 'CliExitCodes.ERROR')

  t.ok(!isNaN(CliExitCodes.SUCCESS), 'SUCCESS')
  t.ok(!isNaN(CliExitCodes.ERROR.SYNTAX), 'ERROR.SYNTAX')
  t.ok(!isNaN(CliExitCodes.ERROR.APPLICATION), 'ERROR.APPLICATION')
  t.ok(!isNaN(CliExitCodes.ERROR.INPUT), 'ERROR.INPUT')
  t.ok(!isNaN(CliExitCodes.ERROR.OUTPUT), 'ERROR.OUTPUT')

  t.end()
})

test('exitCodes', (t) => {
  t.test('CliError', (t) => {
    try {
      throw new CliError('one')
    } catch (err) {
      t.equal(err.message, 'one', 'message one')
      t.equal(err.exitCode, undefined, 'no code')
    }
    try {
      throw new CliError('two', 7)
    } catch (err) {
      t.equal(err.message, 'two', 'message two')
      t.equal(err.exitCode, 7, 'code')
    }
    t.end()
  })

  t.test('CliErrorSyntax', (t) => {
    try {
      throw new CliErrorSyntax('one')
    } catch (err) {
      t.equal(err.message, 'one', 'message one')
      t.equal(err.exitCode, CliExitCodes.ERROR.SYNTAX, 'code')
    }
    t.end()
  })

  t.test('CliErrorApplication', (t) => {
    try {
      throw new CliErrorApplication('one')
    } catch (err) {
      t.equal(err.message, 'one', 'message one')
      t.equal(err.exitCode, CliExitCodes.ERROR.APPLICATION, 'code')
    }
    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------
