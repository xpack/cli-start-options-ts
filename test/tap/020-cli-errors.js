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

// const assert = require('assert')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const CliExitCodes = require('../../index.js').CliExitCodes
const CliError = require('../../index.js').CliError
const CliErrorSyntax = require('../../index.js').CliErrorSyntax
const CliErrorApplication = require('../../index.js').CliErrorApplication
const CliErrorType = require('../../index.js').CliErrorType
const CliErrorInput = require('../../index.js').CliErrorInput
const CliErrorOutput = require('../../index.js').CliErrorOutput

// ----------------------------------------------------------------------------

test('asserts', (t) => {
  t.true(CliExitCodes !== undefined, 'CliExitCodes is defined')
  t.true(CliError !== undefined, 'CliError is defined')
  t.true(CliErrorSyntax !== undefined, 'CliErrorSyntax is defined')
  t.true(CliErrorApplication !== undefined, 'CliErrorApplication is defined')
  t.true(CliErrorType !== undefined, 'CliErrorType is defined')
  t.true(CliErrorInput !== undefined, 'CliErrorInput is defined')
  t.true(CliErrorOutput !== undefined, 'CliErrorOutput is defined')

  t.end()
})

test('types', (t) => {
  t.true(CliError.prototype instanceof Error, 'CliError is Error')
  t.true(CliErrorSyntax.prototype instanceof Error, 'CliErrorSyntax is Error')
  t.true(CliErrorApplication.prototype instanceof Error,
    'CliErrorApplication is Error')
  t.true(CliErrorType.prototype instanceof Error, 'CliErrorType is Error')
  t.true(CliErrorInput.prototype instanceof Error, 'CliErrorInput is Error')
  t.true(CliErrorOutput.prototype instanceof Error, 'CliErrorOutput is Error')

  t.true(CliExitCodes instanceof Object, 'CliExitCodes is Object')
  t.true(CliExitCodes.ERROR instanceof Object, 'CliExitCodes.ERROR is Object')

  t.true(!isNaN(CliExitCodes.SUCCESS), 'SUCCESS is a number')
  t.true(!isNaN(CliExitCodes.ERROR.SYNTAX), 'ERROR.SYNTAX is a number')
  t.true(!isNaN(CliExitCodes.ERROR.APPLICATION),
    'ERROR.APPLICATION is a number')
  t.true(!isNaN(CliExitCodes.ERROR.INPUT), 'ERROR.INPUT is a number')
  t.true(!isNaN(CliExitCodes.ERROR.OUTPUT), 'ERROR.OUTPUT is a number')
  t.true(!isNaN(CliExitCodes.ERROR.CHILD), 'ERROR.CHILD is a number')
  t.true(!isNaN(CliExitCodes.ERROR.PREREQUISITES),
    'ERROR.PREREQUISITES is a number')
  t.true(!isNaN(CliExitCodes.ERROR.TYPE), 'ERROR.TYPE is a number')

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

  t.test('CliErrorType', (t) => {
    try {
      throw new CliErrorType('one')
    } catch (err) {
      t.equal(err.message, 'one', 'message is one')
      t.equal(err.exitCode, CliExitCodes.ERROR.TYPE,
        'exit code is type')
    }
    t.end()
  })

  t.test('CliErrorInput', (t) => {
    try {
      throw new CliErrorInput('one')
    } catch (err) {
      t.equal(err.message, 'one', 'message is one')
      t.equal(err.exitCode, CliExitCodes.ERROR.INPUT,
        'exit code is input')
    }
    t.end()
  })

  t.test('CliErrorOutput', (t) => {
    try {
      throw new CliErrorOutput('one')
    } catch (err) {
      t.equal(err.message, 'one', 'message is one')
      t.equal(err.exitCode, CliExitCodes.ERROR.OUTPUT,
        'exit code is output')
    }
    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------
