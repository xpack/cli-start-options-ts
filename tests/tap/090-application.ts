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
 * Test the `Application` class.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as nonStrictAssert from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// https://www.npmjs.com/package/@xpack/mock-console
import { MockConsole, dumpLines } from '@xpack/mock-console'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

// Be sure the AssertionError is the same, regardless the namespace,
// so that further tests do not need to check both.
assert(assert.AssertionError === nonStrictAssert.AssertionError,
  'non-unique AssertionError')

assert(cli.Application)
dumpLines()

// ----------------------------------------------------------------------------

const mockConsole = new MockConsole()
const log = new cli.Logger({ console: mockConsole, level: 'info' })

// ----------------------------------------------------------------------------

class MockApplicationStatic extends cli.Application {
  constructor (params: cli.ApplicationConstructorParams) {
    super(params)

    const context: cli.Context = this.context

    context.rootPath = '/a/b/c'
  }

  override async start (): Promise<number> {
    return 42
  }
}

await test('cli.Application static start()', async (t) => {
  // Fails to match the exception in async functions.
  // https://github.com/tapjs/node-tap/issues/865

  // t.throws(async () => {
  //   await cli.Application.start()
  // }, assert.AssertionError, 'assert(application.context.rootPath)')

  try {
    await cli.Application.start()
    t.fail('does not throw')
  } catch (error: any) {
    // console.log(error)
    t.ok(error instanceof assert.AssertionError,
      'assert(application.context.rootPath)')
  }

  await t.test('default', async (t) => {
    const exitCode = await MockApplicationStatic.start()
    t.equal(exitCode, 42, 'exit 42')

    t.end()
  })

  t.end()
})

await test('cli.Application static processStartError', async (t) => {
  t.throws(() => {
    cli.Application.processStartError({
      log,
      error: new assert.AssertionError({ message: 'oops!' })
    })
  }, assert.AssertionError, 'AssertionError')

  await t.test('instanceof cli.Error', async (t) => {
    const mockConsole = new MockConsole()
    // No level. to check if the code sets it.
    const log = new cli.Logger({ console: mockConsole })

    const exitCode = cli.Application.processStartError({
      log,
      error: new cli.Error('my error', 42)
    })

    t.equal(exitCode, 42, 'exit 42')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    const expectedErrorLines = [
      'error: my error' // 0
    ]

    t.equal(mockConsole.errLines.length, expectedErrorLines.length,
      'error lines count')
    // Compare content, not object.
    t.same(mockConsole.errLines, expectedErrorLines, 'error lines')

    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  await t.test('system error', async (t) => {
    mockConsole.clear()

    const exitCode = cli.Application.processStartError({
      log,
      error: new Error('my error')
    })

    t.equal(exitCode, cli.ExitCodes.ERROR.APPLICATION, 'ERROR.APPLICATION')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.ok(mockConsole.errLines.length > 0, 'has error lines')
    // Compare content, not object.
    t.equal(mockConsole.errLines[0], 'Error: my error', 'my error')
    t.match(mockConsole.errLines[1], '    at ', 'second line is stack')
    t.match(mockConsole.errLines[mockConsole.errLines.length - 1], '    at ',
      'last line is stack')

    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------

class MockApplicationNoDispatch extends cli.Application {
  constructor (params: cli.ApplicationConstructorParams) {
    super(params)

    const context: cli.Context = this.context

    context.rootPath = '/a/b/c'
  }

  // Shortcut.
  override async dispatchCommand (_argv: string[]): Promise<number> {
    return 42
  }
}

await test('cli.Application start()', async (t) => {
  mockConsole.clear()

  // `t.throws()` fails to match the exception in async functions.
  try {
    mockConsole.clear()

    const context = new cli.Context({ log })
    const application = new MockApplicationNoDispatch({ context })

    await application.start()
    t.fail('assert(packageJson.name) not thrown')
  } catch (error: any) {
    t.ok(error instanceof assert.AssertionError,
      'assert(packageJson.name)')
    t.equal(error.message, 'packageJson.name', 'packageJson.name')
  }

  try {
    mockConsole.clear()

    const packageJson = { name: '@scope/name' }
    const context = new cli.Context({
      log,
      packageJson: packageJson as cli.NpmPackageJson
    })

    const application = new MockApplicationNoDispatch({ context })

    await application.start()
    t.fail('assert(packageJson.version) not thrown')
  } catch (error: any) {
    // console.log(error)
    t.ok(error instanceof assert.AssertionError,
      'assert(packageJson.version)')
    t.equal(error.message, 'packageJson.version', 'packageJson.version')
  }

  await t.test('help description as name', async (t) => {
    mockConsole.clear()

    const packageJson = {
      name: '@scope/name',
      version: '1.2.3'
    }
    const context = new cli.Context({
      log,
      packageJson: packageJson as cli.NpmPackageJson
    })

    const application = new MockApplicationNoDispatch({ context })

    const exitCode = await application.start()

    t.equal(exitCode, 42, 'exit 42')

    // console.log(application.getCommandDescription())
    t.equal(application.getCommandDescription(), packageJson.name,
      'description is name')

    t.end()
  })

  await t.test('help description', async (t) => {
    mockConsole.clear()

    const packageJson = {
      description: 'My description',
      name: '@scope/name',
      version: '1.2.3'
    }
    const context = new cli.Context({
      log,
      packageJson: packageJson as cli.NpmPackageJson
    })

    const application = new MockApplicationNoDispatch({ context })

    const exitCode = await application.start()

    t.equal(exitCode, 42, 'exit 42')

    // console.log(application.getCommandDescription())
    t.equal(application.getCommandDescription(), packageJson.description,
      'description ok')

    t.end()
  })

  await t.test('validate engine', async (t) => {
    mockConsole.clear()

    const packageJson = {
      description: 'My description',
      name: '@scope/name',
      version: '1.2.3',
      engines: {
        node: ' >=9999'
      }
    }
    const context = new cli.Context({
      log,
      packageJson: packageJson as cli.NpmPackageJson
    })

    const application = new MockApplicationNoDispatch({ context })

    const exitCode = await application.start()

    t.equal(exitCode, cli.ExitCodes.ERROR.PREREQUISITES,
      'exit ERROR.PREREQUISITES')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    const expectedErrorLines = [
      'Please use a newer node (at least >=9999).', // 0
      '' // 1
    ]

    t.equal(mockConsole.errLines.length, expectedErrorLines.length,
      'error lines count')
    // Compare content, not object.
    t.same(mockConsole.errLines, expectedErrorLines, 'error lines content')

    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  await t.test('version request', async (t) => {
    mockConsole.clear()

    // Local logger to check if the version is shown even when set to silent.
    const log = new cli.Logger({ console: mockConsole, level: 'silent' })

    const packageJson = {
      description: 'My description',
      name: '@scope/name',
      version: '1.2.3'
    }
    const context = new cli.Context({
      log,
      packageJson: packageJson as cli.NpmPackageJson
    })

    context.processArgv = ['', '', '--version']

    const application = new MockApplicationNoDispatch({ context })

    const exitCode = await application.start()

    t.equal(exitCode, cli.ExitCodes.SUCCESS,
      'exit SUCCESS')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '1.2.3' // 0
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('help request', async (t) => {
    mockConsole.clear()

    const packageJson = {
      description: 'My description',
      name: '@scope/name',
      version: '1.2.3'
    }
    const context = new cli.Context({
      log,
      programName: 'xyz',
      packageJson: packageJson as cli.NpmPackageJson
    })

    context.processArgv = ['', '', '-h']

    const application = new MockApplicationNoDispatch({ context })

    const exitCode = await application.start()

    t.equal(exitCode, cli.ExitCodes.SUCCESS,
      'exit SUCCESS')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      '', //  0
      'My description', //  1
      '', //  2
      'Usage: xyz [options...]', //  3
      '', //  4
      'Common options:', //  5
      '  --loglevel <level>    Set log level (silent|warn|info|verbose|debug|trace) (optional)', //  6
      '  -s|--silent           Disable all messages (--loglevel silent) (optional)', //  7
      '  -q|--quiet            Mostly quiet, warnings and errors (--loglevel warn) (optional)', //  8
      '  --informative         Informative (--loglevel info) (optional)', //  9
      '  -v|--verbose          Verbose (--loglevel verbose) (optional)', // 10
      '  -d|--debug            Debug messages (--loglevel debug) (optional)', // 11
      '  -dd|--trace           Trace messages (--loglevel trace, -d -d) (optional)', // 12
      '  --no-update-notifier  Skip check for a more recent version (optional)', // 13
      '  -C <folder>           Set current folder (optional)', // 14
      '', // 15
      'xyz -h|--help           Quick help', // 16
      'xyz --version           Show version', // 17
      '', // 18
      "npm @scope/name@1.2.3 '/a/b/c'" // 19
    ]
    /* eslint-enable max-len */

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------

class MockApplicationNoCommands extends cli.Application {
  constructor (params: cli.ApplicationConstructorParams) {
    super(params)

    const context: cli.Context = this.context

    context.rootPath = '/a/b/c'
  }
}

class MockApplicationTwoCommands extends cli.Application {
  constructor (params: cli.ApplicationConstructorParams) {
    super(params)

    const context: cli.Context = this.context

    context.rootPath = '/a/b/c'

    this.commandsTree.addCommands({
      one: {
        moduleRelativePath: '.'
      },
      two: {
        moduleRelativePath: '.'
      }
    })
  }
}

await test('cli.Application identifyCommands()', async (t) => {
  mockConsole.clear()

  try {
    const packageJson = { name: '@scope/name' }
    const context = new cli.Context({
      log,
      packageJson: packageJson as cli.NpmPackageJson
    })

    const application = new MockApplicationNoCommands({ context })

    application.identifyCommands(undefined as unknown as string[])
    t.fail('assert(mainArgv) not thrown')
  } catch (error: any) {
    // console.log(error)
    t.ok(error instanceof assert.AssertionError,
      'assert(mainArgv)')
    t.equal(error.message, 'mainArgv', 'mainArgv')
  }

  // If the application has no commands defined, it should not match anything.
  await t.test('no commands', async (t) => {
    const packageJson = { name: '@scope/name' }
    const context = new cli.Context({
      log,
      packageJson: packageJson as cli.NpmPackageJson
    })

    const application = new MockApplicationNoCommands({ context })
    t.strictSame(application.identifyCommands(['abc', '-o', 'def']), [],
      'empty')

    t.end()
  })

  const packageJson = { name: '@scope/name' }
  const context = new cli.Context({
    log,
    packageJson: packageJson as cli.NpmPackageJson
  })

  const application = new MockApplicationTwoCommands({ context })
  t.strictSame(
    application.identifyCommands(['abc', 'dEf', 'G-k', '-o', 'def']),
    ['abc', 'def', 'g-k'],
    'has commands'
  )

  t.end()
})

// ----------------------------------------------------------------------------

class MockApplication extends cli.Application {
  constructor (params: cli.ApplicationConstructorParams) {
    super(params)

    const context: cli.Context = this.context

    context.rootPath = '/a/b/c'

    this.commandsTree.setHelpDescription('The Xyz Title')
    this.commandsTree.shouldSplitForwardableArguments = true
  }

  override async main (
    argv: string[],
    forwardableArgv: string[]
  ): Promise<number> {
    const context: cli.Context = this.context

    const log = context.log
    argv.forEach((arg, ix) => {
      log.info(`argv[${ix}]='${arg}'`)
    })

    forwardableArgv.forEach((arg, ix) => {
      log.info(`forwardableArgv[${ix}]='${arg}'`)
    })

    return 42
  }
}

await test('cli.Application dispatchCommand()', async (t) => {
  mockConsole.clear()

  try {
    const packageJson = { name: '@scope/name' }
    const context = new cli.Context({
      log,
      packageJson: packageJson as cli.NpmPackageJson
    })

    const application = new MockApplication({ context })

    await application.dispatchCommand(undefined as unknown as string[])
    t.fail('assert(argv) not thrown')
  } catch (error: any) {
    // console.log(error)
    t.ok(error instanceof assert.AssertionError,
      'assert(argv)')
    t.equal(error.message, 'argv', 'argv')
  }

  try {
    const packageJson = { name: '@scope/name' }
    const context = new cli.Context({
      log,
      packageJson: packageJson as cli.NpmPackageJson
    })

    const application = new MockApplication({ context })

    await application.dispatchCommand([])
    t.fail('assert(packageJson.version) not thrown')
  } catch (error: any) {
    // console.log(error)
    t.ok(error instanceof assert.AssertionError,
      'assert(packageJson.version)')
    t.equal(error.message, 'packageJson.version', 'packageJson.version')
  }

  await t.test('version request', async (t) => {
    mockConsole.clear()

    // Local logger to check if the version is shown even when set to silent.
    const log = new cli.Logger({ console: mockConsole, level: 'silent' })

    const packageJson = {
      name: '@scope/name',
      version: '1.2.3'
    }
    const context = new cli.Context({
      log,
      programName: 'xyz',
      packageJson: packageJson as cli.NpmPackageJson,
      processArgv: ['', '', '--version']
    })

    const application = new MockApplication({ context })

    context.config.isVersionRequest = true

    const exitCode = await application.start()

    t.equal(exitCode, cli.ExitCodes.SUCCESS,
      'exit SUCCESS')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '1.2.3' // 0
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('help request', async (t) => {
    mockConsole.clear()

    const packageJson = {
      name: '@scope/name',
      version: '1.2.3'
    }
    const context = new cli.Context({
      log,
      programName: 'xyz',
      packageJson: packageJson as cli.NpmPackageJson,
      processArgv: ['', '', '-h']
    })

    const application = new MockApplication({ context })

    const exitCode = await application.start()

    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit SUCCESS')

    // dumpLines(mockConsole.errLines)
    dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      '', //  0
      '@scope/name', //  1
      '', //  2
      'Usage: xyz [options...]', //  3
      '', //  4
      'Common options:', //  5
      '  --loglevel <level>    Set log level (silent|warn|info|verbose|debug|trace) (optional)', //  6
      '  -s|--silent           Disable all messages (--loglevel silent) (optional)', //  7
      '  -q|--quiet            Mostly quiet, warnings and errors (--loglevel warn) (optional)', //  8
      '  --informative         Informative (--loglevel info) (optional)', //  9
      '  -v|--verbose          Verbose (--loglevel verbose) (optional)', // 10
      '  -d|--debug            Debug messages (--loglevel debug) (optional)', // 11
      '  -dd|--trace           Trace messages (--loglevel trace, -d -d) (optional)', // 12
      '  --no-update-notifier  Skip check for a more recent version (optional)', // 13
      '  -C <folder>           Set current folder (optional)', // 14
      '', // 15
      'xyz -h|--help           Quick help', // 16
      'xyz --version           Show version', // 17
      '', // 18
      "npm @scope/name@1.2.3 '/a/b/c'" // 19
    ]
    /* eslint-enable max-len */

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('invoke main()', async (t) => {
    mockConsole.clear()

    const packageJson = {
      name: '@scope/name',
      version: '1.2.3'
    }
    const context = new cli.Context({
      log,
      programName: 'xyz',
      packageJson: packageJson as cli.NpmPackageJson,
      processArgv: ['', '', 'abc', '-bcd', 'cde', '--def', '--', '--xyz']
    })

    const application = new MockApplication({ context })

    const exitCode = await application.start()

    t.equal(exitCode, 42, 'exit 42')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      "argv[0]='abc'", // 0
      "argv[1]='-bcd'", // 1
      "argv[2]='cde'", // 2
      "argv[3]='--def'", // 3
      "forwardableArgv[0]='--xyz'" // 4
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------

class MockApplicationErrors extends cli.Application {
  constructor (params: cli.ApplicationConstructorParams) {
    super(params)

    const context: cli.Context = this.context

    context.rootPath = '/a/b/c'

    this.commandsTree.setHelpDescription('The Xyz Title')
  }

  override async main (
    argv: string[]
  ): Promise<number> {
    if (argv.length === 0) {
      return 42
    }

    const flag: boolean = false
    switch (argv[0]) {
      case 'assert':
        assert(flag, 'assert(false)')
        break

      case 'SyntaxError':
        throw new cli.SyntaxError('syntax')

      case 'Error':
        throw new cli.Error('error')

      case 'System':
        throw new Error('system')
    }
    return 42
  }
}

await test('cli.Application processCommandError()', async (t) => {
  mockConsole.clear()

  await t.test('AssertionError', async (t) => {
    mockConsole.clear()

    const packageJson = {
      name: '@scope/name',
      version: '1.2.3'
    }
    const context = new cli.Context({
      log,
      programName: 'xyz',
      packageJson: packageJson as cli.NpmPackageJson,
      processArgv: ['', '', 'assert']
    })

    const application = new MockApplicationErrors({ context })

    try {
      await application.start()
      t.fail('does not throw')
    } catch (error: any) {
      t.ok(error instanceof assert.AssertionError,
        'AssertionError')
      t.equal(error.message, 'assert(false)', 'assert(false)')
    }

    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------
