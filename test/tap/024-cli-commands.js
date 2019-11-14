/*
 * This file is part of the xPack distribution
 *   (http://xpack.github.io).
 * Copyright (c) 2019 Liviu Ionescu.
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
 * Test command identification.
 */

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const Common = require('../common.js').Common
const CliExitCodes = require('../../index.js').CliExitCodes

// ----------------------------------------------------------------------------

/**
 * Test commands that do not have an implementation derived from CliCommand.
 */
test('xtest notclass (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'notclass'
    ])
    t.equal(code, CliExitCodes.ERROR.APPLICATION, 'exit code is app')
    t.equal(stdout.length, 0, 'stdout is empty')
    // console.log(stderr)
    t.true(stderr.length > 1, 'stderr has lines')
    t.match(stderr[0], 'AssertionError', 'stderr is assertion')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test commands that are not unique.
 */
test('xtest co (lib)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'co'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is app')
    // console.log(stderr)
    t.true(stdout.length > 0, 'has stdout')
    t.match(stdout[2], 'Usage: xtest <command>', 'stderr[3] is Usage')
    t.equal(stderr.length, 1, 'stderr has 1 line')
    t.equal(stderr[0], "error: Command 'co' is not unique.",
      'stderr is error')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------

test('xtest multi --help', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      '--help'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    // console.log(stdout)
    t.match(stdout[1], 'Multiple subcommands', 'has title')
    t.match(stdout[2], 'Usage: xtest multi <command> [<options>...] ...',
      'has Usage')

    t.match(stdout[4], 'where <command> is one of:', 'has where')
    t.match(stdout[5], '  first, second', 'has subcommands')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 4, 'has 4 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple subcommands', 'has title')
    t.match(stdout[1], 'no args', 'has no args')
    t.match(stdout[3], '\'xtest multi\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi -m mmm', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      '-m',
      'mmm'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 5, 'has 5 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple subcommands', 'has title')
    t.match(stdout[1], 'multi: mmm', 'has -m')
    t.match(stdout[2], 'no args', 'has no args')
    t.match(stdout[4], '\'xtest multi\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi -m mmm 1 2', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      '-m',
      'mmm',
      'one',
      'two'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 6, 'has 6 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple subcommands', 'has title')
    t.match(stdout[1], 'multi: mmm', 'has -m')
    t.match(stdout[2], 'one', 'has one')
    t.match(stdout[3], 'two', 'has two')
    t.match(stdout[5], '\'xtest multi\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi 1 2', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'one',
      'two'
    ])
    // Check exit code.
    // console.log(code)
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.true(stdout.length > 0, 'has stdout')
    // console.log(stdout)
    t.match(stdout[1], 'Mock Test', 'has title')
    t.match(stdout[2], 'Usage: xtest <command> [<options>...] ...',
      'has Usage')

    // There should be no error messages.
    t.equal(stderr.length, 1, 'stderr 1 line')
    t.match(stderr[0], 'error: Command \'multi one\' is not supported.',
      'not supported')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi first --help', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'first',
      '--help'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    // console.log(stdout)
    t.match(stdout[1], 'Multiple first', 'has title')
    t.match(stdout[2], 'Usage: xtest multi first [<options>...] ...',
      'has Usage')

    t.match(stdout[4], 'Multi first:', 'has first group')
    t.match(stdout[5], '  --first <int>', 'has --first')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi first', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'first'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 4, 'has 4 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple first', 'has title')
    t.match(stdout[1], 'no args', 'has no args')
    t.match(stdout[3], '\'xtest multi first\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi first -m mmm --first fff', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'first',
      '-m',
      'mmm',
      '--first',
      'fff'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 6, 'has 6 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple first', 'has title')
    t.match(stdout[1], 'multi: mmm', 'has -m')
    t.match(stdout[2], 'first: fff', 'has --first')
    t.match(stdout[3], 'no args', 'has no args')
    t.match(stdout[5], '\'xtest multi first\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi first -m mmm --first fff 1 2', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'first',
      '-m',
      'mmm',
      '--first',
      'fff',
      'one',
      'two'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 7, 'has 7 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple first', 'has title')
    t.match(stdout[1], 'multi: mmm', 'has -m')
    t.match(stdout[2], 'first: fff', 'has --first')
    t.match(stdout[3], 'one', 'has one')
    t.match(stdout[4], 'two', 'has two')
    t.match(stdout[6], '\'xtest multi first\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi first 1 2', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'first',
      'one',
      'two'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 5, 'has 5 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple first', 'has title')
    t.match(stdout[1], 'one', 'has one')
    t.match(stdout[2], 'two', 'has two')
    t.match(stdout[4], '\'xtest multi first\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi second --help', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'second',
      '--help'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.true(stdout.length > 0, 'has stdout')
    // console.log(stdout)
    t.match(stdout[1], 'Multiple second', 'has title')
    t.match(stdout[2], 'Usage: xtest multi second [<options>...] ...',
      'has Usage')

    t.match(stdout[4], 'Multi second:', 'has second group')
    t.match(stdout[5], ' --second <int>', 'has --second')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi second', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'second'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 4, 'has 4 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple second', 'has title')
    t.match(stdout[1], 'no args', 'has no args')
    t.match(stdout[3], '\'xtest multi second\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi second -m mmm --second fff', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'second',
      '-m',
      'mmm',
      '--second',
      'fff'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 6, 'has 6 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple second', 'has title')
    t.match(stdout[1], 'multi: mmm', 'has -m')
    t.match(stdout[2], 'second: fff', 'has --second')
    t.match(stdout[3], 'no args', 'has no args')
    t.match(stdout[5], '\'xtest multi second\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi second -m mmm --second fff 1 2', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'second',
      '-m',
      'mmm',
      '--second',
      'fff',
      'one',
      'two'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 7, 'has 7 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple second', 'has title')
    t.match(stdout[1], 'multi: mmm', 'has -m')
    t.match(stdout[2], 'second: fff', 'has --second')
    t.match(stdout[3], 'one', 'has one')
    t.match(stdout[4], 'two', 'has two')
    t.match(stdout[6], '\'xtest multi second\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

test('xtest multi second 1 2', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.libRunXtest([
      'multi',
      'second',
      'one',
      'two'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout.length, 5, 'has 5 stdout')
    // console.log(stdout)
    t.match(stdout[0], 'Multiple second', 'has title')
    t.match(stdout[1], 'one', 'has one')
    t.match(stdout[2], 'two', 'has two')
    t.match(stdout[4], '\'xtest multi second\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
