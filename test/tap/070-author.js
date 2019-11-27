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
 * Test author.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const Common = require('../common.js').Common

// ES6: `import { CliExitCodes } from 'cli-start-options'
const CliExitCodes = require('../../index.js').CliExitCodes

assert(Common)
assert(CliExitCodes)

// ----------------------------------------------------------------------------

/**
 * Test if help includes single line author.
 */
test('ytest -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.libRunYtest([
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')

      t.true(stdout.length > 0, 'has stdout')
      const str = stdout.join('\n')
      t.match(stdout[3], 'Usage: ytest <command>', 'has Usage')
      t.match(str, 'Bug reports: Liviu Ionescu <ilg@livius.net>',
        'has Bug reports')

      // There should be no error messages.
      t.equal(stderr.length, 0, 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test if help includes multi-line author.
 */
test('ztest -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.libRunZtest([
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')

      t.true(stdout.length > 0, 'has stdout')
      const str = stdout.join('\n')
      t.match(stdout[3], 'Usage: ztest <command>', 'has Usage')
      t.match(str, 'Bug reports: Liviu Ionescu <ilg@livius.net>',
        'has Bug reports')

      // There should be no error messages.
      t.equal(stderr.length, 0, 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test if help has no bugs and author.
 */
test('dtest -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.libRunDtest([
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')

      t.true(stdout.length > 0, 'has stdout')
      const str = stdout.join('\n')
      t.match(stdout[3], 'Usage: dtest [<options>...]', 'has Usage')
      t.notMatch(str, 'Bug reports:',
        'has no Bug reports')

      // There should be no error messages.
      t.equal(stderr.length, 0, 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test if help has no bugs and author is no object or string.
 */
test('etest -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.libRunEtest([
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')

      t.true(stdout.length > 0, 'has stdout')
      const str = stdout.join('\n')
      t.match(stdout[3], 'Usage: etest [<options>...]', 'has Usage')
      t.notMatch(str, 'Bug reports:',
        'has no Bug reports')

      // There should be no error messages.
      t.equal(stderr.length, 0, 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

// ----------------------------------------------------------------------------
