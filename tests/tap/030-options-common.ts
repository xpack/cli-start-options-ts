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
 * Test common options, like --version, --help, etc.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as os from 'node:os'
import * as path from 'node:path'

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

import { Common, mockPath } from '../mock/common.js'
import {
  CliApplication,
  CliExitCodes,
  NpmPackageJson
} from '../../dist/index.js'

// ----------------------------------------------------------------------------

assert(Common)
assert(CliApplication)
assert(CliExitCodes)

// ----------------------------------------------------------------------------

let pack: NpmPackageJson

// ----------------------------------------------------------------------------

/**
 * Read package.json, to later compare version.
 */
await test('setup', async (t) => {
  // Read in the package.json, to later compare version.
  const rootPath = mockPath('xtest')
  pack = await CliApplication.readPackageJson(rootPath)
  t.ok(pack, 'package ok')
  t.ok(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

/**
 * Test if --version returns the package version.
 */
await test('xtest --version (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    // Check if version matches the package.
    // Beware, the stdout string has a new line terminator.
    t.equal(stdout, pack.version + '\n', 'version value')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -h shows usage. Check usage content.
 */
await test('xtest -h (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    // console.log(stdout)
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
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if --help shows usage.
 */
await test('xtest --help (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--help'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Usage: xtest <command>', 'has Usage')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -d adds debug lines.
 */
await test('xtest --version -d (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version',
      '-d'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.ok(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'debug: start arg0:', 'has debug')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -dd adds trace lines.
 */
await test('xtest --version -dd (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version',
      '-dd'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.ok(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'trace: Xtest.constructor()', 'has debug')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -d -d adds trace lines.
 */
await test('xtest --version -d -d (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version',
      '-d',
      '-d'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.ok(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'trace: Xtest.constructor()', 'has debug')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test commands that do not have an implementation derived from CliCommand.
 */
await test('xtest notclass (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'notclass'
    ])
    t.equal(code, CliExitCodes.ERROR.APPLICATION, 'exit code is app')
    // console.log(stdout)
    t.equal(stdout, '', 'stdout is empty')
    // console.log(stderr)
    t.match(stderr, 'AssertionError', 'stderr is assertion')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test commands that are not unique.
 */
await test('xtest co (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'co'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is app')
    // console.log(stderr)
    t.equal(stderr, "error: Command 'co' is not unique.\n",
      'stderr is error')
    t.match(stdout, 'Usage: xtest <command>', 'stderr[3] is Usage')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if --loglevel debug adds debug lines.
 */
await test('xtest --version --loglevel debug (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version',
      '--loglevel',
      'debug'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.ok(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'debug: start arg0:', 'has debug')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -s silences the help too.
 */
await test('xtest xx -s (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'xx',
      '-s',
      'debug'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout, '', 'stdout is empty')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -q shows warnings.
 */
await test('xtest long --long value --xx -q (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'long',
      '--long',
      'value',
      '--xx',
      '-q',
      'debug'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.equal(stdout, '', 'stdout is empty')
    t.equal(stderr, "warning: Option '--xx' not supported; ignored\n",
      'stderr is warning')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if default verbosity is none.
 */
await test('xtest verb (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Done', 'stdout is done')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
await test('xtest verb --informative (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb',
      '--informative'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Exercise verbosity', 'stdout is info')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
await test('xtest verb -v (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb',
      '-v'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Exercise verbosity', 'stdout is verbose')
    t.match(stdout, 'Verbose', 'stdout is verbose')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if explicit verbosity is honoured.
 */
await test('xtest verb --verbose (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'verb',
      '--verbose'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Exercise verbosity', 'stdout is verbose')
    t.match(stdout, 'Verbose', 'stdout is verbose')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if not allowed value in common options.
 */
await test('xtest --loglevel xxx (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--loglevel',
      'xxx'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout, '', 'stdout is empty')
    t.match(stderr, "error: Value 'xxx' not allowed for '--loglevel'",
      'stderr is message')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if value not given.
 */
await test('xtest --loglevel (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--loglevel'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout, '', 'stdout is empty')
    t.match(stderr, "error: '--loglevel' expects a value",
      'stderr is message')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -- is ignored.
 */
await test('xtest --loglevel -- (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--loglevel'
    ])
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.equal(stdout, '', 'stdout is empty')
    t.match(stderr, "error: '--loglevel' expects a value",
      'stderr is message')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if -- is ignored adds trace lines.
 */
await test('xtest --version -dd -- xx (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '--version',
      '-dd',
      '--',
      'xx'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.ok(stdout.length > 0, 'has stdout')
    // Matching the whole string also checks that
    // the colour changes are not used.
    t.match(stdout, 'trace: Xtest.constructor()', 'has debug')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if long post options are moved to the next line.
 */
await test('xtest long -h (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'long',
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, '                  [-- <very-long-long-long-args>...]',
      'stdout has long post options')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if long with unused.
 */
await test('xtest long -xyz (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'long',
      '--long',
      'value',
      '--xyz'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'Done', 'stdout is done')
    t.match(stderr, "warning: Option '--xyz' not supported; ignored\n",
      'stderr has error')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if long early options are moved to the next line.
 */
await test('xtest -h (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, '                                         Extra options',
      'stdout has long early options')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test if many options are moved to the next line.
 */
await test('xtest many -h (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'many',
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, '                  [--two <name>]+',
      'stdout has many options')
    t.match(stdout, '[--four <s>]', 'has <s>')
    t.match(stdout, '  --four <s>  ', 'has <s>')
    t.match(stdout, 'Option two (multiple)', 'has multiple')
    t.match(stdout, 'Option three (optional, multiple)',
      'has optional multiple')
    t.match(stdout, 'Option four (optional)', 'has optional')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test long program name.
 */
await test('wtest-long-name -h (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.wtestCli([
      '-h'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, 'wtest-long-name -h|--help            Quick help',
      'has long name')
    t.match(stdout, '  five-long-command,', 'has command five')
    t.match(stdout, '  two-long-command', 'has command two')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test generator.
 */
await test('xtest gen (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'gen'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    // console.log(stdout)
    t.match(stdout, 'generators:', 'stdout has generators')
    assert(pack?.homepage)
    t.match(stdout, `homepage: '${pack.homepage}'`)
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test unimplemented command.
 */
await test('xtest unim (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'unim'
    ])
    t.equal(code, CliExitCodes.ERROR.APPLICATION, 'exit code is app')
    t.match(stderr, 'AssertionError', 'stdout has assertion')
    t.equal(stdout, '', 'stdout is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test no command.
 */
// await test('xtest (spawn)', async (t) => {
//   try {
//     const { code, stdout, stderr } = await Common.xtestCli([
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

/**
 * Test no command with app options.
 */
// await test('xtest -- xx (spawn)', async (t) => {
//   try {
//     const { code, stdout, stderr } = await Common.xtestCli([
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

/**
 * Test no command with app options.
 */
await test('xtest cwd -C /tmp/xx (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'cwd',
      '-C',
      '/tmp/xx'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    t.match(stdout, '/tmp/xx\n', 'stdout has path')
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

/**
 * Test no command with app options.
 */
await test('xtest cwd -C /tmp/xx -C yy (spawn)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestCli([
      'cwd',
      '-C',
      '/tmp/xx',
      '-C',
      'yy'
    ])
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    const absPath = path.resolve('/tmp/xx', 'yy')
    if (os.platform() === 'win32') {
      t.match(stdout, absPath, 'stdout has path')
    } else {
      t.match(stdout, absPath, 'stdout has path')
    }
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    t.fail(err.message)
  }
  t.end()
})

// ----------------------------------------------------------------------------
