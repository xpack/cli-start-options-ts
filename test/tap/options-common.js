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

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const Common = require('../common.js').Common

const CliApplication = require('../../index.js').CliApplication
const CliExitCodes = require('../../index.js').CliExitCodes

assert(Common)
assert(CliApplication)
assert(CliExitCodes)

// ----------------------------------------------------------------------------

let pack = null
const rootPath = path.resolve(path.dirname(__dirname), 'mock')
// console.log(rootPath)

// ----------------------------------------------------------------------------

/**
 * Read package.json, to later compare version.
 */
test('setup', async (t) => {
  // Read in the package.json, to later compare version.
  pack = await CliApplication.readPackageJson(rootPath)
  t.ok(pack, 'package ok')
  t.ok(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

/**
 * Test if --version returns the package version.
 */
test('xtest --version (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    // Check if version matches the package.
    // Beware, the stdout string has a new line terminator.
    t.equal(stdout, pack.version + '\n', 'version value')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -h shows usage. Check usage content.
 */
test('xtest -h (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    // console.log(stdout)
    t.match(stdout, 'Usage: xtest <command>', 'has Usage')

    t.match(stdout, 'Mock Test', 'has title')
    t.match(stdout, 'xtest -h|--help', 'has -h|--help')
    t.match(stdout, 'xtest <command> -h|--help', 'has <command> -h|--help')
    t.match(stdout, 'xtest --version', 'has --version')
    t.match(stdout, 'xtest -i|--interactive', 'has -i|--interactive')
    t.match(stdout, 'Set log level (silent|warn|info|verbose|debug|trace)',
      'has log levels')
    t.match(stdout, '-s|--silent', 'has -s|--silent')
    t.match(stdout, 'Bug reports:', 'has Bug reports:')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if --help shows usage.
 */
test('xtest --help (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--help'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Usage: xtest <command>', 'has Usage')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -d adds debug lines.
 */
test('xtest --version -d (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version',
      '-d'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.ok(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'DEBUG: start arg0:', 'has debug')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -dd adds trace lines.
 */
test('xtest --version -dd (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version',
      '-dd'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.ok(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'TRACE: Xtest.constructor()', 'has debug')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test commands that do not have an implementation derived from CliCommand.
 */
test('xtest notclass (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'notclass'
    ])
    t.equal(code, CliExitCodes.ERROR.APPLICATION, 'exit code is app')
    t.equal(stdout, '', 'stdout is empty')
    // console.log(stderr)
    t.match(stderr, 'AssertionError:', 'stderr is assertion')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test commands that are not unique.
 */
test('xtest co (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'co'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is app')
    // console.log(stderr)
    t.equal(stderr, "ERROR: Command 'co' is not unique.\n",
      'stderr is error')
    t.match(stdout, 'Usage: xtest <command>', 'stderr[3] is Usage')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if --loglevel debug adds debug lines.
 */
test('xtest --version --loglevel debug (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version',
      '--loglevel',
      'debug'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.ok(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'DEBUG: start arg0:', 'has debug')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -s silences the help too.
 */
test('xtest xx -s (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'xx',
      '-s',
      'debug'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout, '', 'stdout is empty')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if default verbosity is none.
 */
test('xtest verb (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout, '', 'stdout is empty')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
test('xtest verb -v (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb',
      '-v'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Exercise verbosity', 'stdout is verbose')
    t.notMatch(stdout, 'Extra verbose', 'stdout is not extra verbose')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
test('xtest verb --verbose (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb',
      '--verbose'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Exercise verbosity', 'stdout is verbose')
    t.notMatch(stdout, 'Extra verbose', 'stdout is not extra verbose')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
test('xtest verb -vv (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb',
      '-vv'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Exercise verbosity', 'stdout is verbose')
    t.match(stdout, 'Extra verbose', 'stdout is extra verbose')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
test('xtest verb --extra-verbose (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb',
      '--extra-verbose'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Exercise verbosity', 'stdout is verbose')
    t.match(stdout, 'Extra verbose', 'stdout is extra verbose')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
test('xtest verb -v -v (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb',
      '-v',
      '-v'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Exercise verbosity', 'stdout is verbose')
    t.match(stdout, 'Extra verbose', 'stdout is extra verbose')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if not allowed value in common options.
 */
test('xtest --loglevel xxx (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--loglevel',
      'xxx'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout, '', 'stdout is empty')
    t.match(stderr, "ERROR: Value 'xxx' not allowed for '--loglevel'",
      'stderr is message')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
