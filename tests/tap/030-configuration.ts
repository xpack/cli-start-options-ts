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
 * Test the configuration class.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.Configuration)

// ----------------------------------------------------------------------------

await test('cli.Configuration constructor', async (t) => {
  const config = new cli.Configuration()

  t.equal(config.logLevel, cli.defaultLogLevel, 'log level default')
  t.equal(config.cwd, process.cwd(), 'cwd process')

  t.equal(config.isHelpRequest, false, 'isHelpRequest false')
  t.equal(config.isVersionRequest, false, 'isVersionRequest false')
  t.equal(config.noUpdateNotifier, false, 'noUpdateNotifier false')
  t.equal(config.interactiveServerPort, undefined,
    'interactiveServerPort undefined')

  t.end()
})

// ----------------------------------------------------------------------------
