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
 * Test if with empty line fails with mandatory error and displays help.
 */
test('ytest -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.ytestCli([
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
      // console.log(errLines)
      t.match(stdout, 'Usage: ytest', 'has Usage')
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
 * Test if with empty line fails with mandatory error and displays help.
 */
test('ztest -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.ztestCli([
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
      // console.log(errLines)
      t.match(stdout, 'Usage: ztest', 'has Usage')
      t.match(stdout, 'Bug reports: Liviu Ionescu <ilg@livius.net>',
        'has Bug reports')
      // There should be no error messages.
      t.equal(stderr, '', 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

// ----------------------------------------------------------------------------
