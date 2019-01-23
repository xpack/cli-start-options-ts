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
const path = require('path')
// const os = require('os')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const Common = require('../common.js').Common

const CliExitCodes = require('../../index.js').CliExitCodes
const CliUtil = require('../../index.js').CliUtil

assert(Common)

// ----------------------------------------------------------------------------

let pack = null
const rootAbsolutePath = path.resolve(path.dirname(__dirname),
  Common.xtest.mockPath)
// console.log(rootAbsolutePath)

// ----------------------------------------------------------------------------

/**
 * Read package.json, to later compare version.
 */
test('setup', async (t) => {
  // Read in the package.json, to later compare version.
  pack = await CliUtil.readPackageJson(rootAbsolutePath)
  t.true(pack, 'package ok')
  t.true(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

/**
 * Test if --version returns the package version.
 */
test('xtest --version (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.cliRunXtest([
      '--version'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 1, 'stdout has one line')
    // Check if version matches the package.
    // Beware, the stdout string has a new line terminator.
    t.equal(stdout[0], pack.version, 'version value')
    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest xyz (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.cliRunXtest([
      'xyz'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.true(stdout.length > 0, 'has stdout')
    t.match(stdout[1], 'Mock Test', 'has title')
    t.match(stdout[2], 'Usage: xtest <command>', 'has Usage')
    // There should be one error message.
    t.equal(stderr.length, 1, 'stderr has 1 line')
    t.match(stderr[0], 'Command \'xyz\' is not supported.', 'error')
  } catch (err) {
    console.log(err.stack)
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -h shows usage. Check usage content.
 */
test('xtest -h (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.cliRunXtest([
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    // console.log(stdout)
    t.equal(stdout.length, 32, 'stdout has 17 lines')
    t.match(stdout[1], 'Mock Test', 'has title')
    t.match(stdout[2], 'Usage: xtest <command> [<options>...] ...',
      'has Usage')

    const str = stdout.join('\n')
    t.match(str, '--loglevel <level>', 'has --loglevel <level>')
    t.match(str,
      'Set log level (silent|warn|info|verbose|debug|trace)',
      'has log levels list')
    t.match(str, '-s|--silent', 'has -s|--silent')
    t.match(str, '-q|--quiet', 'has -q|--quiet')
    t.match(str, '--informative', 'has --informative')
    t.match(str, '-v|--verbose', 'has -v|--verbose')
    t.match(str, '-d|--debug', 'has -d|--debug')
    t.match(str, '-dd|--trace', 'has -dd|--trace')

    t.match(str, '--no-update-notifier', 'has --no-update-notifier')

    t.match(str, '-C <folder>', 'has -C <folder>')

    t.match(str, 'xtest -h|--help', 'has -h|--help')
    t.match(str, 'xtest <command> -h|--help',
      'has <command> -h|--help')
    t.match(str, 'xtest --version', 'has --version')
    t.match(str, 'xtest -i|--interactive', 'has -i|--interactive')

    t.match(str, 'Home page:', 'has Home page')
    t.match(str, 'Bug reports:', 'has Bug reports:')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
