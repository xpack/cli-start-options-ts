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
 * Test the utilities.
 */

// ----------------------------------------------------------------------------

import { AssertionError, strict as assert } from 'node:assert'
// import * as fs from 'node:fs'
// import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.readPackageJson)
assert(cli.formatDuration)
assert(cli.formatSize)

// ----------------------------------------------------------------------------

await test('getProgramName', async (t) => {
  t.equal(cli.getProgramName('a/b.c'), 'b', 'dotted name')
  t.equal(cli.getProgramName('a/b'), 'b', 'undotted name')
  t.equal(cli.getProgramName('a/b '), 'b', 'undotted name with space')
  const processName = path.basename(process.argv[1] as string).split('.')[0]
  t.equal(cli.getProgramName(), processName, 'process name')

  {
    const savedArgv1: string | undefined = process.argv[1]
    process.argv[1] = undefined as unknown as string
    t.throws(() => {
      cli.getProgramName()
    }, AssertionError, 'assertion argv1')
    process.argv[1] = savedArgv1 as string
  }

  t.throws(() => {
    cli.getProgramName('')
  }, AssertionError, 'assertion programName')
  t.end()
})

await test('readPackageJson', async (t) => {
  const rootPath = path.dirname(path.dirname(path.dirname(
    fileURLToPath(import.meta.url))))
  const json = await cli.readPackageJson(rootPath)
  t.ok(json, 'has json')
  t.equal(json.name, '@xpack/cli-start-options', 'name is right')
  t.ok(json.version, 'version is present')

  try {
    await cli.readPackageJson(undefined as unknown as string)
    t.ok(false, 'assertion folderAbsolutePath')
  } catch (err: any) {
    t.ok(err instanceof AssertionError, 'assertion folderAbsolutePath')
  }

  t.end()
})

await test('formatDuration', (t) => {
  t.equal(cli.formatDuration(1), '1 ms', '1 ms')
  t.equal(cli.formatDuration(999), '999 ms', '999 ms')

  t.equal(cli.formatDuration(1000), '1.000 sec', '1.000 sec')
  t.equal(cli.formatDuration(1499), '1.499 sec', '1.499 sec')
  t.equal(cli.formatDuration(1500), '1.500 sec', '1.500 sec')
  t.equal(cli.formatDuration(1999), '1.999 sec', '1.999 sec')

  t.end()
})

await test('formatSize', (t) => {
  t.equal(cli.formatSize(1), '1 B', '1 B')
  t.equal(cli.formatSize(1024 + 512 - 1), '1535 B', '1535 B')
  t.equal(cli.formatSize(1024 + 512), '2 kB', '2 kB')
  t.equal(cli.formatSize(1024 * (1024 + 512) - 1), '1536 kB', '1536 kB')
  t.equal(cli.formatSize(1024 * (1024 + 512)), '2 MB', '2 MB')

  t.end()
})

// ----------------------------------------------------------------------------
