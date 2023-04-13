/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2023 Liviu Ionescu. All rights reserved.
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
 * Test the `Help` class.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// https://www.npmjs.com/package/@xpack/mock-console
import { MockConsole, dumpLines } from '@xpack/mock-console'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.Help)
dumpLines([])

// ----------------------------------------------------------------------------


await test('cli.Help constructor', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({console: mockConsole, level: 'info'})
  const context = new cli.Context({ log })

  const help = new cli.Help({context})

  t.ok(help.middleLimit > 0, 'middleLimit > 0')
  t.ok(help.rightLimit > 0, 'rightLimit > 0')
  t.ok(help.rightLimit > help.middleLimit, 'rightLimit > middleLimit')

  help.output('info')

  // dumpLines(mockConsole.outLines)
  // dumpLines(mockConsole.errLines)

  t.equal(mockConsole.outLines.length, 1, 'one output line')
  t.equal(mockConsole.outLines[0], 'info', 'content: info')
  t.equal(mockConsole.errLines.length, 0, 'no error lines')

  mockConsole.clear()

  log.level = 'silent'
  help.output('silent')

  // dumpLines(mockConsole.outLines)
  // dumpLines(mockConsole.errLines)

  t.equal(mockConsole.outLines.length, 0, 'no output lines')
  t.equal(mockConsole.errLines.length, 0, 'no error lines')

  mockConsole.clear()

  const helpAlways = new cli.Help({context, isOutputAlways: true})
  helpAlways.output('info')

  // dumpLines(mockConsole.outLines)
  // dumpLines(mockConsole.errLines)

  t.equal(mockConsole.outLines.length, 1, 'one output line')
  t.equal(mockConsole.outLines[0], 'info', 'content: info')
  t.equal(mockConsole.errLines.length, 0, 'no error lines')

  mockConsole.clear()

  log.level = 'silent'
  helpAlways.output('silent')

  // dumpLines(mockConsole.outLines)
  // dumpLines(mockConsole.errLines)

  t.equal(mockConsole.outLines.length, 1, 'one output line')
  t.equal(mockConsole.outLines[0], 'silent', 'content: silent')
  t.equal(mockConsole.errLines.length, 0, 'no error lines')

  t.end()
})

// ----------------------------------------------------------------------------
