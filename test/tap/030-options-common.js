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
const os = require('os')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const Common = require('../common.js').Common

const CliExitCodes = require('../../index.js').CliExitCodes
const CliUtils = require('../../index.js').CliUtils

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
  pack = await CliUtils.readPackageJson(rootAbsolutePath)
  t.true(pack, 'package ok')
  t.true(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

/**
 * Test if --version returns the package version.
 */
test('xtest --version (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
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

/**
 * Test if -h shows usage. Check usage content.
 */
test('xtest -h (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
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

/**
 * Test if --help shows usage.
 */
test('xtest --help (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--help'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout[2], 'Usage: xtest <command>', 'has Usage')
    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -d adds debug lines.
 */
test('xtest --version -d (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--version',
      '-d'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    const str = stdout.join('\n')
    t.match(str, 'debug: params.argv', 'has debug')
    // console.log(stdout)
    t.equal(stdout[7], pack.version, 'version value')
    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -dd adds trace lines.
 */
test('xtest --version -dd (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--version',
      '-dd'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    t.match(stdout[0], 'trace: Logger.constructor()', 'has Logger constructor')
    const str = stdout.join('\n')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(str, 'trace: Xtest.constructor()', 'has trace')
    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -d -d adds trace lines.
 */
test('xtest --version -d -d (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--version',
      '-d',
      '-d'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    const str = stdout.join('\n')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(str, 'trace: Xtest.constructor()', 'has trace')
    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if --loglevel debug adds debug lines.
 */
test('xtest --version --loglevel debug (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--version',
      '--loglevel',
      'debug'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    const str = stdout.join('\n')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(str, 'debug: params.argv', 'has debug')
    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -s silences the help too.
 */
test('xtest xx -s (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'xx',
      '-s',
      'debug'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout.length, 0, 'stdout is empty')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -q shows warnings.
 */
test('xtest long --long value --xx -q (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'long',
      '--long',
      'value',
      '--xx',
      '-q',
      'debug'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 0, 'stdout is empty')
    t.equal(stderr.length, 1, 'stderr has 1 line')
    t.equal(stderr[0], "warning: Option '--xx' not supported; ignored",
      'stderr is warning')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if default verbosity is none.
 */
test('xtest verb (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'verb'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 3, 'stdout has 3 lines')
    t.match(stdout[2], 'completed in', 'stdout is completed')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if unique v is recognised.
 */
test('xtest v (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'v'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 3, 'stdout has 3 lines')
    t.match(stdout[2], 'completed in', 'stdout is completed')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
test('xtest verb --informative (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'verb',
      '--informative'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 3, 'stdout has 3 lines')
    t.match(stdout[0], 'Exercise verbosity', 'stdout is verbosity')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
test('xtest verb -v (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'verb',
      '-v'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 5, 'stdout has 5 lines')
    t.match(stdout[1], 'Exercise verbosity', 'stdout is verbose')
    t.match(stdout[2], 'Verbose', 'stdout is verbose')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
test('xtest verb --verbose (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'verb',
      '--verbose'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 5, 'stdout has 5 lines')
    t.match(stdout[1], 'Exercise verbosity', 'stdout is verbose')
    t.match(stdout[2], 'Verbose', 'stdout is verbose')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if not allowed value in common options.
 */
test('xtest --loglevel xxx (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--loglevel',
      'xxx'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout.length, 0, 'stdout is empty')
    t.equal(stderr.length, 1, 'stderr has 1 line')
    t.match(stderr[0], "error: Value 'xxx' not allowed for '--loglevel'",
      'stderr is message')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if value not given.
 */
test('xtest --loglevel (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--loglevel'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout.length, 0, 'stdout is empty')
    t.equal(stderr.length, 1, 'stderr has 1 line')
    t.match(stderr[0], "error: '--loglevel' expects a value",
      'stderr is message')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -- is ignored.
 */
test('xtest --loglevel -- (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--loglevel'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout.length, 0, 'stdout is empty')
    t.equal(stderr.length, 1, 'stderr has 1 line')
    t.match(stderr[0], "error: '--loglevel' expects a value",
      'stderr is message')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -- is ignored adds trace lines.
 */
test('xtest --version -dd -- xx (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--version',
      '-dd',
      '--',
      'xx'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    const str = stdout.join('\n')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(str, 'trace: Xtest.constructor()', 'has debug')
    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if the description for long options is moved to the next line.
 */
test('xtest long -h (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'long',
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    t.match(stdout[5], '--long|--very-long|--extra-very-long <name>',
      'stdout has long options')
    t.match(stdout[6],
      '                                         Very long option',
      'was moved to next line')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if long with unused.
 */
test('xtest long -xyz (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'long',
      '--long',
      'value',
      '--xyz'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 3, 'stdout has 3 lines')
    t.match(stdout[2], 'completed in', 'stdout is completed')
    t.equal(stderr.length, 1, 'stderr has 1 line')
    t.match(stderr[0], "warning: Option '--xyz' not supported; ignored",
      'stderr has error')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if long early options are moved to the next line.
 */
test('xtest -h (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    const str = stdout.join('\n')
    t.match(str,
      '                                         Extra options',
      'stdout has long early options')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if many options are moved to the next line.
 */
test('xtest many -h (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'many',
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    t.match(stdout[6], '--two <name>', 'has <name>')
    t.match(stdout[6], 'Option two (multiple)', 'has multiple')
    t.match(stdout[7], 'Option three (optional, multiple)',
      'has optional multiple')
    t.match(stdout[8], '--four <s>', 'has <s>')
    t.match(stdout[8], 'Option four (optional)', 'has optional')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test long program name.
 */
test('wtest-long-name -h (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunWtest([
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    t.match(stdout[19], 'wtest-long-name -h|--help            Quick help',
      'has long name')
    t.match(stdout[5], '  five-long-command,', 'has command five')
    t.match(stdout[6], '  two-long-command', 'has command two')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test generator.
 */
test('xtest gen (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'gen'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    // console.log(stdout.length)
    const str = stdout.join('\n')
    // console.log(str)
    t.match(str, 'generators:', 'stdout has generators')
    t.match(str, `homepage: '${pack.homepage}'`)
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test unimplemented command.
 */
test('xtest unim (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'unim'
    ])
    t.equal(code, CliExitCodes.ERROR.APPLICATION, 'exit code is app')
    t.equal(stdout.length, 0, 'stdout is empty')
    t.true(stderr.length > 1, 'stderr has lines')
    t.match(stderr[0], 'AssertionError', 'stdout has assertion')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test no command.
 */
test('xtest (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.true(stdout.length > 0, 'has stdout')
    t.match(stdout[2], 'Usage: xtest <command>', 'stdout has usage')
    t.equal(stderr.length, 1, 'stderr has 1 line')
    t.equal(stderr[0], 'error: Missing mandatory command.', 'stdout has error')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test no command with app options.
 */
test('xtest -- xx (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      '--',
      'xx'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.true(stdout.length > 0, 'has stdout')
    t.match(stdout[2], 'Usage: xtest <command>', 'stdout has usage')
    t.equal(stderr.length, 1, 'stderr has 1 line')
    t.equal(stderr[0], 'error: Missing mandatory command.',
      'stdout has error')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test no command with app options.
 */
test('xtest cwd -C /tmp/xx (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'cwd',
      '-C',
      '/tmp/xx'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 4, 'stdout has 4 lines')
    t.match(stdout[1], '/tmp/xx', 'stdout has path')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test cumulative -C.
 */
test('xtest cwd -C /tmp/xx -C yy (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'cwd',
      '-C',
      '/tmp/xx',
      '-C',
      'yy'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 4, 'stdout has 4 lines')
    const absPath = path.resolve('/tmp/xx', 'yy')
    if (os.platform() === 'win32') {
      t.match(stdout[1], absPath, 'stdout has path')
    } else {
      t.match(stdout[1], absPath, 'stdout has path')
    }
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test no command with app options.
 */
test('xtest noopts (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'noopts',
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    // console.log(stdout)
    t.true(stdout.length > 0, 'has stdout')
    t.match(stdout[2], 'Usage: xtest noopts [<options>...]', 'stdout has usage')
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
