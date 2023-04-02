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

/**
 * Test common options, like --version, --help, etc.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
// import * as os from 'node:os'
// import * as path from 'node:path'

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

import {
  // dumpLines,
  mockPath,
  runLibXtest,
  splitLines
  // runCliXtest
} from '../mock/common.js'
import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.Application)
assert(cli.ExitCodes)

// ----------------------------------------------------------------------------

let pack: cli.NpmPackageJson

// ----------------------------------------------------------------------------

/**
 * Read package.json, to later compare version.
 */
await await test('setup', async (t) => {
  // Read in the package.json, to later compare version.
  const rootPath = mockPath('xtest')
  pack = await cli.readPackageJson(rootPath)
  t.ok(pack, 'package ok')
  t.ok(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

// ----------------------------------------------------------------------------

await test('xtest multi --help', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      '--help'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')
    const outLines = splitLines(stdout)

    // dumpLines(outLines)
    t.ok(outLines.length > 0, 'has stdout')
    t.match(outLines[1], 'Multiple subcommands', 'has title')
    t.match(outLines[3], 'Usage: xtest multi <command> ' +
      '[<subcommand>...] [<options> ...] [<args>...]',
    'has Usage')

    t.match(outLines[5], 'where <command> is one of:', 'has where')
    t.match(outLines[6], '  first, second', 'has subcommands')

    // There should be no error messages.
    // console.log(stderr)
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // dumpLines(outLines)
    t.equal(outLines.length, 4, 'has 4 stdout')
    t.match(outLines[0], 'Multiple subcommands', 'has title')
    t.match(outLines[1], 'no args', 'has no args')
    t.equal(outLines[2], '', 'has empty line')
    t.match(outLines[3], '\'xtest multi\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi -m mmm', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      '-m',
      'mmm'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // dumpLines(outLines)
    t.equal(outLines.length, 5, 'has 5 stdout')
    t.match(outLines[0], 'Multiple subcommands', 'has title')
    t.match(outLines[1], 'multi: mmm', 'has -m')
    t.match(outLines[2], 'no args', 'has no args')
    t.equal(outLines[3], '', 'has empty line')
    t.match(outLines[4], '\'xtest multi\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi -m mmm 1 2', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      '-m',
      'mmm',
      'one',
      'two'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // console.log(stdout)
    t.equal(outLines.length, 6, 'has 6 stdout')
    t.match(outLines[0], 'Multiple subcommands', 'has title')
    t.match(outLines[1], 'multi: mmm', 'has -m')
    t.match(outLines[2], 'one', 'has one')
    t.match(outLines[3], 'two', 'has two')
    t.equal(outLines[4], '', 'has empty line')
    t.match(outLines[5], '\'xtest multi\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi 1 2', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      'one',
      'two'
    ])
    // Check exit code.
    // console.log(code)
    t.equal(exitCode, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')

    const outLines = splitLines(stdout)
    // dumpLines(outLines)
    t.ok(outLines.length > 0, 'has stdout')
    t.match(outLines[1], 'Multiple subcommands', 'has title')
    t.match(outLines[3],
      'xtest multi <command> [<subcommand>...] [<options> ...] [<args>...]',
      'has Usage')

    const errLines = splitLines(stderr)
    // dumpLines(errLines)
    t.equal(errLines.length, 1, 'stderr 1 line')
    t.match(errLines[0], 'error: Command \'multi one\' is not supported.',
      'not supported')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi first --help', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      'first',
      '--help'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // dumpLines(outLines)
    t.ok(outLines.length > 0, 'has stdout')
    t.match(outLines[1], 'Multiple first', 'has title')
    t.match(outLines[3],
      'Usage: xtest multi first [options...] [--first <int>] [--multi <name>]',
      'has Usage')

    t.match(outLines[5], 'Multi first options:', 'has first group')
    t.match(outLines[6], '  --first <int>', 'has --first')

    t.match(outLines[8], 'Multi options:', 'has multi group')
    t.match(outLines[9], '  --multi|-m <name>', 'has --multi')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi first', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      'first'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // console.log(stdout)
    t.equal(outLines.length, 4, 'has 4 stdout')
    t.match(outLines[0], 'Multiple first', 'has title')
    t.match(outLines[1], 'no args', 'has no args')
    t.equal(outLines[2], '', 'has empty line')
    t.match(outLines[3], '\'xtest multi first\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi first -m mmm --first fff', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      'first',
      '-m',
      'mmm',
      '--first',
      'fff'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // console.log(stdout)
    t.equal(outLines.length, 6, 'has 6 stdout')
    t.match(outLines[0], 'Multiple first', 'has title')
    t.match(outLines[1], 'multi: mmm', 'has -m')
    t.match(outLines[2], 'first: fff', 'has --first')
    t.match(outLines[3], 'no args', 'has no args')
    t.equal(outLines[4], '', 'has empty line')
    t.match(outLines[5], '\'xtest multi first\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi first -m mmm --first fff 1 2', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
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
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    t.equal(outLines.length, 7, 'has 7 stdout')
    // console.log(stdout)
    t.match(outLines[0], 'Multiple first', 'has title')
    t.match(outLines[1], 'multi: mmm', 'has -m')
    t.match(outLines[2], 'first: fff', 'has --first')
    t.match(outLines[3], 'one', 'has one')
    t.match(outLines[4], 'two', 'has two')
    t.equal(outLines[5], '', 'has empty line')
    t.match(outLines[6], '\'xtest multi first\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi first 1 2', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      'first',
      'one',
      'two'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // console.log(stdout)
    t.equal(outLines.length, 5, 'has 5 stdout')
    t.match(outLines[0], 'Multiple first', 'has title')
    t.match(outLines[1], 'one', 'has one')
    t.match(outLines[2], 'two', 'has two')
    t.equal(outLines[3], '', 'has empty line')
    t.match(outLines[4], '\'xtest multi first\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

// Test without isInsertInFront
await test('xtest multi second --help', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      'second',
      '--help'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // dumpLines(outLines)
    t.ok(outLines.length > 0, 'has stdout')
    t.match(outLines[1], 'Multiple second', 'has title')
    t.match(outLines[3],
      'Usage: xtest multi second [options...] [--multi <name>] ' +
      '[--second <int>]',
      'has Usage')

    t.match(outLines[5], 'Multi options:', 'has multi group')
    t.match(outLines[6], ' --multi|-m <name>', 'has --multi')

    t.match(outLines[8], 'Multi second options:', 'has second group')
    t.match(outLines[9], ' --second <int>', 'has --second')

    t.match(outLines[12], ' --more-common <int>', 'has --more')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi second', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      'second'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // dumpLines(outLines)
    t.equal(outLines.length, 4, 'has 4 stdout')
    t.match(outLines[0], 'Multiple second', 'has title')
    t.match(outLines[1], 'no args', 'has no args')
    t.equal(outLines[2], '', 'has empty line')
    t.match(outLines[3],
      '\'xtest multi second\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi second -m mmm --second fff', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      'second',
      '-m',
      'mmm',
      '--second',
      'fff'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    t.equal(outLines.length, 6, 'has 6 stdout')
    // console.log(stdout)
    t.match(outLines[0], 'Multiple second', 'has title')
    t.match(outLines[1], 'multi: mmm', 'has -m')
    t.match(outLines[2], 'second: fff', 'has --second')
    t.match(outLines[3], 'no args', 'has no args')
    t.equal(outLines[4], '', 'has empty line')
    t.match(outLines[5],
      '\'xtest multi second\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi second -m mmm --second fff 1 2', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
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
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    t.equal(outLines.length, 7, 'has 7 stdout')
    // console.log(stdout)
    t.match(outLines[0], 'Multiple second', 'has title')
    t.match(outLines[1], 'multi: mmm', 'has -m')
    t.match(outLines[2], 'second: fff', 'has --second')
    t.match(outLines[3], 'one', 'has one')
    t.match(outLines[4], 'two', 'has two')
    t.equal(outLines[5], '', 'has empty line')
    t.match(outLines[6],
      '\'xtest multi second\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

await test('xtest multi second 1 2', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runLibXtest([
      'multi',
      'second',
      'one',
      'two'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    const outLines = splitLines(stdout)
    // console.log(stdout)
    t.equal(outLines.length, 5, 'has 5 stdout')
    t.match(outLines[0], 'Multiple second', 'has title')
    t.match(outLines[1], 'one', 'has one')
    t.match(outLines[2], 'two', 'has two')
    t.equal(outLines[3], '', 'has empty line')
    t.match(outLines[4],
      '\'xtest multi second\' completed in ', 'has completed')

    // There should be no error messages.
    t.equal(stderr.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
