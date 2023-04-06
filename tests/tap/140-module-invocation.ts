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

/*
 * Test the direct invocation as a module.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// https://www.npmjs.com/package/@xpack/mock-console
import { dumpLines } from '@xpack/mock-console'

// ----------------------------------------------------------------------------

import { mockPath, runLibXtest } from '../mock/common.js'

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.Application)
assert(cli.ExitCodes)

// ----------------------------------------------------------------------------

let pack: cli.NpmPackageJson

// To silence ts-standard.
dumpLines([])

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

await test('xtest --version (module call)', async (t) => {
  try {
    const { exitCode, outLines, errLines } = await runLibXtest([
      '--version'
    ])

    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

    // Check if version matches the package.
    // Beware, the stdout string has a new line terminator.
    t.equal(outLines[0], pack.version, 'version value')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    console.log(err.stack)
    t.fail(err.message)
  }
  t.end()
})

await test('xtest xyz (module call)', async (t) => {
  try {
    const { exitCode, outLines, errLines } = await runLibXtest([
      'xyz'
    ])

    // Check exit code.
    t.equal(exitCode, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, 'Usage: xtest <command>', 'has Usage')

    t.ok(errLines.length > 0, 'stderr has lines')
    // There should be one error message.
    t.match(errLines[0], 'Command \'xyz\' is not supported.', 'error')
  } catch (err: any) {
    console.log(err.stack)
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
