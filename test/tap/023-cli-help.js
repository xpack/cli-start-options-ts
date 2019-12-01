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
 * Test common options, like --version, --help, etc.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')
// const path = require('path')
// const os = require('os')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const Common = require('../common.js').Common

const CliExitCodes = require('../../index.js').CliExitCodes
// const CliUtils = require('../../index.js').CliUtils

assert(Common)

// ----------------------------------------------------------------------------

// let pack = null
// const rootAbsolutePath = path.resolve(path.dirname(__dirname),
//  Common.xtest.mockPath)
// console.log(rootAbsolutePath)

// ----------------------------------------------------------------------------

/**
 * Test if -h shows usage. Check usage content.
 */
test('none', async (t) => {
  t.end()
})

test('ctest -h (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunCtest([
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')

    // console.log(stdout)
    t.true(stdout.length > 1, 'has stdout')
    t.match(stdout[1], 'Mock Test', 'has title')
    t.match(stdout[3], 'Usage: ctest [<options>...] ...',
      'has Usage')

    const str = stdout.join('\n')
    t.notMatch(str, 'Bug reports: someone', 'has no bugs')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
