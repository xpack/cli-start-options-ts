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
 * Test the direct invocation as a module.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

// ----------------------------------------------------------------------------

import { mockPath, runCliXtest, splitLines } from '../mock/common.js'

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.Application)
assert(cli.ExitCodes)

// ----------------------------------------------------------------------------

let pack: cli.NpmPackageJson

// ----------------------------------------------------------------------------

await test('setup', async (t) => {
  // Read in the package.json, to later compare version.
  const rootPath = mockPath('xtest')
  pack = await cli.readPackageJson(rootPath)
  t.ok(pack, 'package parsed')
  t.ok(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

await test('xtest --version (cli call)', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runCliXtest([
      '--version'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')
    const outLines = splitLines(stdout)
    // console.log(outLines)
    t.equal(outLines.length, 1, 'stdout has one line')
    // Check if version matches the package.
    // Beware, the stdout string has a new line terminator.
    t.equal(outLines[0], pack.version, 'version value')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    console.log(err.stack)
    t.fail(err.message)
  }
  t.end()
})

await test('xtest xyz (cli call)', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runCliXtest([
      'xyz'
    ])
    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    const outLines = splitLines(stdout)
    t.ok(outLines.length > 0, 'has stdout')
    t.match(outLines[1], 'Mock Test', 'has title')
    t.match(outLines[2], 'Usage: xtest <command>', 'has Usage')

    const errLines = splitLines(stderr)
    // There should be one error message.
    t.equal(errLines.length, 1, 'stderr has 1 line')
    t.match(errLines[0], 'Command \'xyz\' not supported.', 'error')
  } catch (err: any) {
    console.log(err.stack)
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -h shows usage. Check usage content.
 */
await test('xtest -h (cli call)', async (t) => {
  try {
    const { exitCode, stdout, stderr } = await runCliXtest([
      '-h'
    ])
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')
    const outLines = splitLines(stdout)
    // console.log(outLines)
    t.equal(outLines.length, 27, 'stdout has 27 lines')
    t.match(outLines[1], 'Mock Test', 'has title')
    t.match(outLines[2],
      'Usage: xtest <command> [<subcommand>...] [<options> ...] [<args>...]',
      'has Usage')

    t.match(outLines[8], '--loglevel <level>', 'has --loglevel <level>')
    t.match(outLines[8],
      'Set log level (silent|warn|info|verbose|debug|trace)',
      'has log levels list')
    t.match(outLines[9], '-s|--silent', 'has -s|--silent')
    t.match(outLines[10], '-q|--quiet', 'has -q|--quiet')
    t.match(outLines[11], '--informative', 'has --informative')
    t.match(outLines[12], '-v|--verbose', 'has -v|--verbose')
    t.match(outLines[13], '-d|--debug', 'has -d|--debug')
    t.match(outLines[14], '-dd|--trace', 'has -dd|--trace')

    t.match(outLines[15], '--no-update-notifier', 'has --no-update-notifier')

    t.match(outLines[16], '-C <folder>', 'has -C <folder>')

    t.match(outLines[18], 'xtest -h|--help', 'has -h|--help')
    t.match(outLines[19], 'xtest <command> -h|--help',
      'has <command> -h|--help')
    t.match(outLines[20], 'xtest --version', 'has --version')

    t.match(outLines[25], 'Home page:', 'has Home page')
    t.match(outLines[26], 'Bug reports:', 'has Bug reports:')

    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
