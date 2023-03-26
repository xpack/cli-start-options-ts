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

import { mockPath, runCliXtest } from '../mock/common.js'

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
    // Check if version matches the package.
    // Beware, the stdout string has a new line terminator.
    t.equal(stdout, pack.version + '\n', 'version value')
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
    t.match(stdout, 'Usage: xtest <command>', 'has Usage')
    // There should be one error message.
    t.match(stderr, 'Command \'xyz\' not supported.', 'error')
  } catch (err: any) {
    console.log(err.stack)
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
