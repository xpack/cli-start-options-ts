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
 * Test author.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// https://www.npmjs.com/package/@xpack/mock-console
import { dumpLines } from '@xpack/mock-console'

// ----------------------------------------------------------------------------

import {
  runCliA1test,
  runCliA2test,
  runCliA3test
} from '../mock/common.js'
import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.ExitCodes)

// ----------------------------------------------------------------------------

/*
 * Test if author is properly identified.
 */
await test('a1test -h',
  async (t) => {
    try {
      const { exitCode, outLines, errLines } = await runCliA1test([
        '-h'
      ])

      // Check exit code.
      t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')

      if (exitCode !== cli.ExitCodes.SUCCESS) {
        dumpLines(errLines)
        dumpLines(outLines)
      } else {
        // There should be no error messages.
        t.equal(errLines.length, 0, 'stderr is empty')

        t.ok(outLines.length > 0, 'stdout has lines')
        const stdout = outLines.join('\n')
        // console.log(errLines)
        t.match(stdout, 'Usage: a1test', 'has Usage')
        t.match(stdout, 'Bug reports: Liviu Ionescu <ilg@livius.net>',
          'has Bug reports')
      }
    } catch (err: any) {
      t.fail(err.message)
    }
    t.end()
  })

/*
 * Test if author is properly identified.
 */
await test('a2test -h',
  async (t) => {
    try {
      const { exitCode, outLines, errLines } = await runCliA2test([
        '-h'
      ])

      // Check exit code.
      t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')
      if (exitCode !== cli.ExitCodes.SUCCESS) {
        dumpLines(errLines)
        dumpLines(outLines)
      } else {
        // There should be no error messages.
        t.equal(errLines.length, 0, 'stderr is empty')

        t.ok(outLines.length > 0, 'stdout has lines')
        const stdout = outLines.join('\n')
        // console.log(errLines)
        t.match(stdout, 'Usage: a2test', 'has Usage')
        t.match(stdout, 'Bug reports: Liviu Ionescu <ilg@livius.net>',
          'has Bug reports')
      }
    } catch (err: any) {
      t.fail(err.message)
    }
    t.end()
  })

/*
 * Test if author is properly identified.
 */
await test('a3test -h',
  async (t) => {
    try {
      const { exitCode, outLines, errLines } = await runCliA3test([
        '-h'
      ])

      // Check exit code.
      t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit code is success')
      if (exitCode !== cli.ExitCodes.SUCCESS) {
        dumpLines(errLines)
        dumpLines(outLines)
      } else {
        // There should be no error messages.
        t.equal(errLines.length, 0, 'stderr is empty')

        t.ok(outLines.length > 0, 'stdout has lines')
        const stdout = outLines.join('\n')
        // console.log(errLines)
        t.match(stdout, 'Usage: a3test', 'has Usage')
        t.match(stdout, 'Bug reports: <ilg@livius.net>',
          'has Bug reports')
      }
    } catch (err: any) {
      t.fail(err.message)
    }
    t.end()
  })

// ----------------------------------------------------------------------------
