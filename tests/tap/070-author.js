/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/MIT/.
 */

/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/**
 * Test author.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

// ----------------------------------------------------------------------------

import { Common } from '../common.js'

// ES6: `import { CliExitCodes } from 'cli-start-options'
import { CliExitCodes } from '../../dist/index.js'

// ----------------------------------------------------------------------------

assert(Common)
assert(CliExitCodes)

// ----------------------------------------------------------------------------

/**
 * Test if author is properly identified.
 */
test('a1test -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.a1testCli([
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
      // console.log(errLines)
      t.match(stdout, 'Usage: a1test', 'has Usage')
      t.match(stdout, 'Bug reports: Liviu Ionescu <ilg@livius.net>',
        'has Bug reports')
      // There should be no error messages.
      t.equal(stderr, '', 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test if author is properly identified.
 */
test('a2test -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.a2testCli([
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
      // console.log(errLines)
      t.match(stdout, 'Usage: a2test', 'has Usage')
      t.match(stdout, 'Bug reports: Liviu Ionescu <ilg@livius.net>',
        'has Bug reports')
      // There should be no error messages.
      t.equal(stderr, '', 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test if author is properly identified.
 */
test('a3test -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.a3testCli([
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
      // console.log(errLines)
      t.match(stdout, 'Usage: a3test', 'has Usage')
      t.match(stdout, 'Bug reports: <ilg@livius.net>',
        'has Bug reports')
      // There should be no error messages.
      t.equal(stderr, '', 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

// ----------------------------------------------------------------------------
