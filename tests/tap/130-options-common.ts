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
 * Test common options, like --version, --help, etc.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as os from 'node:os'
import * as path from 'node:path'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// https://www.npmjs.com/package/@xpack/mock-console
import { dumpLines } from '@xpack/mock-console'

// ----------------------------------------------------------------------------

import {
  mockPath,
  runLibXtest,
  runCliWtest
  // runCliXtest
} from '../mock/common.js'
import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.Application)
assert(cli.ExitCodes)

// ----------------------------------------------------------------------------

let pack: cli.NpmPackageJson

// To silence ts-standard.
dumpLines([])

// ----------------------------------------------------------------------------

/*
 * Read package.json, to later compare version.
 */
await test('setup', async (t) => {
  // Read in the package.json, to later compare version.
  const rootPath = mockPath('xtest')
  pack = await cli.readPackageJson(rootPath)
  t.ok(pack, 'package ok')
  t.ok(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

/*
 * Test if --version returns the package version.
 */
await test('xtest --version', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--version'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    // Check if version matches the package.
    // Beware, the stdout string has a new line terminator.
    t.equal(outLines[0], pack.version, 'version value')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if -h shows usage. Check usage content.
 */
await test('xtest -h', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '-h'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    // dumpLines(outLines)
    t.match(stdout, 'Usage: xtest <command>', 'has Usage')

    t.match(stdout, 'Mock Test', 'has title')
    t.match(stdout, 'xtest -h|--help', 'has -h|--help')
    t.match(stdout, 'xtest <command> -h|--help', 'has <command> -h|--help')
    t.match(stdout, 'xtest --version', 'has --version')
    t.match(stdout, 'Set log level (silent|warn|info|verbose|debug|trace)',
      'has log levels')
    t.match(stdout, '-s|--silent', 'has -s|--silent')
    t.match(stdout, 'Home page:', 'has Home page')
    t.match(stdout, 'Bug reports:', 'has Bug reports:')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if --help shows usage.
 */
await test('xtest --help', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--help'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, 'Usage: xtest <command>', 'has Usage')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if -d adds debug lines.
 */
await test('xtest --version -d', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--version',
      '-d'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.ok(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'debug: start arg0:', 'has debug')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if -dd adds trace lines.
 */
await test('xtest --version -dd', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--version',
      '-dd'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'trace: Xtest.constructor()', 'has debug')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if -d -d adds trace lines.
 */
await test('xtest --version -d -d', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--version',
      '-d',
      '-d'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'trace: Xtest.constructor()', 'has debug')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test commands that do not have an implementation derived from CliCommand.
 */
await test('xtest notclass', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'notclass'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.ERROR.APPLICATION, 'exit code is app')

    // dumpLines(outLines)
    t.equal(outLines.length, 0, 'stdout is empty')

    // dumpLines(errLines)
    t.ok(errLines.length > 0, 'stderr has lines')
    t.match(errLines[0], 'AssertionError', 'stderr is assertion')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test commands that are not unique.
 */
await test('xtest co', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'co'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.ERROR.SYNTAX, 'exit code is app')

    t.ok(outLines.length > 0, 'stdout has lines')
    t.match(outLines[3], 'Usage: xtest <command>', 'stderr[3] is Usage')

    t.ok(errLines.length > 0, 'stderr has lines')
    // dumpLines(errLines)
    t.equal(errLines[0], "error: Command 'co' is not unique.",
      'stderr is error')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if --loglevel debug adds debug lines.
 */
await test('xtest --version --loglevel debug', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--version',
      '--loglevel',
      'debug'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'debug: start arg0:', 'has debug')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if -s silences the help too.
 */
await test('xtest xx -s', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'xx',
      '-s',
      'debug'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')

    t.equal(outLines.length, 0, 'stdout is empty')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if -q shows warnings.
 */
// await test('xtest long --long value --xx -q', async (t) => {
//   try {
//     const { exitCode: code, outLines, errLines } = await runLibXtest([
//       'long',
//       '--long',
//       'value',
//       '--xx',
//       '-q',
//       'debug'
//     ])

//     // Check exit code.
//     t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

//     t.equal(outLines.length, 0, 'stdout is empty')

//     t.ok(errLines.length > 0, 'stderr has lines')
//     t.equal(errLines[0], "error: Option '--xx' not supported",
//       'stderr is warning')
//   } catch (err: any) {
//     t.fail(err.message)
//   }
//   t.end()
// })

/*
 * Test if default verbosity is none.
 */
await test('xtest verb', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'verb'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, 'Done', 'stdout is done')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if explicit verbosity is honoured.
 */
await test('xtest verb --informative', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'verb',
      '--informative'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, 'Exercise verbosity', 'stdout is info')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if explicit verbosity is honoured.
 */
await test('xtest verb -v', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'verb',
      '-v'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, 'Exercise verbosity', 'stdout is verbose')
    t.match(stdout, 'Verbose', 'stdout is verbose')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if explicit verbosity is honoured.
 */
await test('xtest verb --verbose', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'verb',
      '--verbose'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, 'Exercise verbosity', 'stdout is verbose')
    t.match(stdout, 'Verbose', 'stdout is verbose')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if not allowed value in common options.
 */
await test('xtest --loglevel xxx', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--loglevel',
      'xxx'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')

    t.equal(outLines.length, 0, 'stdout is empty')

    t.ok(errLines.length > 0, 'stderr has lines')
    t.match(errLines[0], "error: Value 'xxx' not allowed for '--loglevel'",
      'stderr is message')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if value not given.
 */
await test('xtest --loglevel', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--loglevel'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')

    t.equal(outLines.length, 0, 'stdout is empty')

    t.ok(errLines.length > 0, 'stderr has lines')
    t.match(errLines[0], "error: '--loglevel' expects a value",
      'stderr is message')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if -- is ignored.
 */
await test('xtest --loglevel --', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--loglevel'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')

    t.equal(outLines.length, 0, 'stdout is empty')

    t.ok(errLines.length > 0, 'stderr has lines')
    t.match(errLines[0], "error: '--loglevel' expects a value",
      'stderr is message')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if -- is ignored adds trace lines.
 */
await test('xtest --version -dd -- xx', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '--version',
      '-dd',
      '--',
      'xx'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'trace: Xtest.constructor()', 'has debug')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if long post options are moved to the next line.
 */
await test('xtest long -h', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'long',
      '-h'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, '                  [-- <very-long-long-long-args>...]',
      'stdout has long post options')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if long with unused.
 */
await test('xtest long -xyz', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'long',
      '--long',
      'value',
      '--xyz'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, 'Usage: xtest long', 'stdout has help')

    t.ok(errLines.length > 0, 'stderr has lines')
    t.match(errLines[0], "error: Option '--xyz' not supported",
      'stderr has error')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if long early options are moved to the next line.
 */
await test('xtest -h', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      '-h'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, '                                         Extra options',
      'stdout has long early options')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test if many options are moved to the next line.
 */
await test('xtest many -h', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'many',
      '-h'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, '                  [--two <name>]+',
      'stdout has many options')
    t.match(stdout, '[--four <s>]', 'has <s>')
    t.match(stdout, '  --four <s>  ', 'has <s>')
    t.match(stdout, 'Option two (multiple)', 'has multiple')
    t.match(stdout, 'Option three (optional, multiple)',
      'has optional multiple')
    t.match(stdout, 'Option four (optional)', 'has optional')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test long program name.
 */
await test('wtest-long-name -h', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runCliWtest([
      '-h'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    // dumpLines(outLines)
    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, 'wtest-long-name -h|--help            Quick help',
      'has long name')
    t.match(stdout, '  five-long-command,', 'has command five')
    t.match(stdout, '  two-long-command', 'has command two')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test generator.
 */
await test('xtest gen', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'gen'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    // dumpLines(outLines)
    t.match(stdout, 'generators:', 'stdout has generators')
    assert(pack?.homepage)
    t.match(stdout, `homepage: '${pack.homepage}'`)

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test unimplemented command.
 */
await test('xtest unim', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'unim'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.ERROR.APPLICATION, 'exit code is app')

    // There should be no error messages.
    t.equal(outLines.length, 0, 'stdout is empty')

    t.ok(errLines.length > 0, 'stderr has lines')
    // After adding the abstract Runnable, the error message changed.
    // t.match(stderr, 'AssertionError', 'stderr has assertion')
    t.match(errLines[0], 'TypeError: this.main is not a function',
      'stderr has error')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test no command.
 */
// await test('xtest', async (t) => {
//   try {
//     const { code, stdout, stderr } = await runLibXtest([
//     ])
//     t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
//     t.equal(stderr, 'error: Missing mandatory command.\n',
//       'stdout has error')
//     t.match(stdout, 'Usage: xtest <command>', 'stdout has usage')
//   } catch (err: any) {
//     t.fail(err.message)
//   }
//   t.end()
// })

/*
 * Test no command with app options.
 */
// await test('xtest -- xx', async (t) => {
//   try {
//     const { code, stdout, stderr } = await runLibXtest([
//       '--',
//       'xx'
//     ])
//     t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
//     t.equal(stderr, 'error: Missing mandatory command.\n',
//       'stdout has error')
//     t.match(stdout, 'Usage: xtest <command>', 'stdout has usage')
//   } catch (err: any) {
//     t.fail(err.message)
//   }
//   t.end()
// })

/*
 * Test no command with app options.
 */
await test('xtest cwd -C /tmp/xx', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'cwd',
      '-C',
      '/tmp/xx'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    t.match(stdout, '/tmp/xx\n', 'stdout has path')

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/*
 * Test no command with app options.
 */
await test('xtest cwd -C /tmp/xx -C yy', async (t) => {
  try {
    const { exitCode: code, outLines, errLines } = await runLibXtest([
      'cwd',
      '-C',
      '/tmp/xx',
      '-C',
      'yy'
    ])

    // Check exit code.
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')

    t.ok(outLines.length > 0, 'stdout has lines')
    const stdout = outLines.join('\n')
    const absPath = path.resolve('/tmp/xx', 'yy')
    if (os.platform() === 'win32') {
      t.match(stdout, absPath, 'stdout has path')
    } else {
      t.match(stdout, absPath, 'stdout has path')
    }

    // There should be no error messages.
    t.equal(errLines.length, 0, 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
