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
 * Test the `Command` class.
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
dumpLines()

// ----------------------------------------------------------------------------

class MockCommand extends cli.Command {
  async main (
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

class MockCommandWithHelp extends cli.Command {
  constructor (params: cli.CommandConstructorParams) {
    super(params)

    const context: cli.Context = this.context
    context.options.addGroups([
      {
        description: 'Common options',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['-h', '--help'],
            init: (context) => {
              context.config.isHelpRequest = false
            },
            action: (context) => {
              context.config.isHelpRequest = true
            },
            helpDefinitions: {
              description: 'Quick help',
              isHelp: true
            }
          }
        ]
      }
    ])
  }

  async main (
    _argv: string[],
    _forwardableArgv: string[]
  ): Promise<number> {
    // const context: cli.Context = this.context

    return 42
  }
}

class MockCommandWithMandatory extends cli.Command {
  constructor (params: cli.CommandConstructorParams) {
    super(params)

    const context: cli.Context = this.context
    context.options.addGroups([
      {
        description: 'Mandatory options',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['-m', '--mandatory'],
            init: () => {},
            action: () => {},
            isMandatory: true,
            helpDefinitions: {
              description: 'Must be present'
            }
          }
        ]
      }
    ])
  }

  async main (
    _argv: string[],
    _forwardableArgv: string[]
  ): Promise<number> {
    // const context: cli.Context = this.context

    return 42
  }
}

// ----------------------------------------------------------------------------

const mockConsole = new MockConsole()
const log = new cli.Logger({ console: mockConsole, level: 'info' })

// ----------------------------------------------------------------------------

await test('cli.Command constructor()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    const command =
      new MockCommand(undefined as unknown as cli.CommandConstructorParams)
    assert(command)
  }, assert.AssertionError, 'assert(params)')

  t.throws(() => {
    const command =
      new MockCommand({ context: undefined as unknown as cli.Context })
    assert(command)
  }, assert.AssertionError, 'assert(params.context)')

  const context = new cli.Context({ log })
  const command = new MockCommand({ context })

  t.ok(command instanceof cli.Command, 'instanceof Command')
  t.equal(command.context, context, 'context')

  t.end()
})

// ----------------------------------------------------------------------------

await test('cli.Command prepareAndRun()', async (t) => {
  mockConsole.clear()

  await t.test('default', async (t) => {
    const context = new cli.Context({ log })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('My Title')

    context.commandNode = commandsTree

    const command = new MockCommand({ context })

    t.ok(command.context.options instanceof cli.Options, 'context.options')
    t.ok(command.context.config instanceof cli.Configuration, 'context.config')

    const exitCode = await command.prepareAndRun({ argv: [] })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, 42, 'exit 42')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')
    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  await t.test('no config', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('The Xyz Title')

    context.commandNode = commandsTree

    const command = new MockCommand({ context })

    t.ok(command.context.options instanceof cli.Options, 'context.options')
    t.ok(command.context.config instanceof cli.Configuration, 'context.config')

    const exitCode = await command.prepareAndRun({
      argv: ['abc', '-bcd', 'cde', '--def', '--', '--xyz']
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, 42, 'exit 42')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      "argv[0]='abc'", // 0
      "argv[1]='-bcd'", // 1
      "argv[2]='cde'", // 2
      "argv[3]='--def'", // 3
      "argv[4]='--'", // 4
      "argv[5]='--xyz'" // 5
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('isHelpRequest', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('The Xyz Title')
    commandsTree.shouldFailOnUnknownOptions = true

    context.commandNode = commandsTree

    const command = new MockCommandWithHelp({ context })

    const exitCode = await command.prepareAndRun({
      argv: ['-h']
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, cli.ExitCodes.SUCCESS, 'SUCCESS')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      'The Xyz Title', // 1
      '', // 2
      'Usage: xyz [options...]', // 3
      '', // 4
      'xyz -h|--help  Quick help', // 5
      '', // 6
      "npm @scope/abc@1.2.3 '/a/b/c'" // 7
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('isMandatory absent', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('The Xyz Title')

    context.commandNode = commandsTree

    const command = new MockCommandWithMandatory({ context })

    const exitCode = await command.prepareAndRun({
      argv: []
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, cli.ExitCodes.ERROR.SYNTAX, 'ERROR.SYNTAX')
    // t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedErrorLines = [
      "error: Mandatory '-m|--mandatory' not found" // 0
    ]

    t.equal(mockConsole.errLines.length, expectedErrorLines.length,
      'error lines count')
    // Compare content, not object.
    t.same(mockConsole.errLines, expectedErrorLines, 'error lines content')

    const expectedLines = [
      '', // 0
      'The Xyz Title', // 1
      '', // 2
      'Usage: xyz [options...]', // 3
      '', // 4
      'Mandatory options:', // 5
      '  -m|--mandatory  Must be present', // 6
      '', // 7
      "npm @scope/abc@1.2.3 '/a/b/c'" // 8
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('isMandatory present', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    context.commandNode = commandsTree

    const command = new MockCommandWithMandatory({ context })

    const exitCode = await command.prepareAndRun({
      argv: ['-m']
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, 42, 'error 42')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')
    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  await t.test('forwardable args', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('The Xyz Title')
    commandsTree.shouldSplitForwardableArguments = true

    context.commandNode = commandsTree

    const command = new MockCommand({ context })

    t.ok(command.context.options instanceof cli.Options, 'context.options')
    t.ok(command.context.config instanceof cli.Configuration, 'context.config')

    const exitCode = await command.prepareAndRun({
      argv: ['abc', '-bcd', 'cde', '--def', '--', '--xyz', 'yzw']
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, 42, 'exit 42')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      "argv[0]='abc'", //  6
      "argv[1]='-bcd'", //  7
      "argv[2]='cde'", //  8
      "argv[3]='--def'", //  9
      "forwardableArgv[0]='--xyz'", // 10
      "forwardableArgv[1]='yzw'" // 11
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('shouldWarnOnUnknownOptions', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('The Xyz Title')
    commandsTree.shouldWarnOnUnknownOptions = true

    context.commandNode = commandsTree

    const command = new MockCommand({ context })

    const exitCode = await command.prepareAndRun({
      argv: ['abc', '-bcd', 'cde', '--def', '--', '--xyz']
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, 42, 'exit 42')

    const expectedErrorLines = [
      "warning: Option '-bcd' ignored", // 0
      "warning: Option '--def' ignored", // 1
      "warning: Option '--' ignored", // 2
      "warning: Option '--xyz' ignored" // 3
    ]
    t.equal(mockConsole.errLines.length, expectedErrorLines.length,
      'error lines count')
    // Compare content, not object.
    t.same(mockConsole.errLines, expectedErrorLines, 'error lines')

    const expectedLines = [
      "argv[0]='abc'", // 0
      "argv[1]='-bcd'", // 1
      "argv[2]='cde'", // 2
      "argv[3]='--def'", // 3
      "argv[4]='--'", // 4
      "argv[5]='--xyz'" // 5
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('shouldWarnOnExtraArguments', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('The Xyz Title')
    commandsTree.shouldWarnOnExtraArguments = true

    context.commandNode = commandsTree

    const command = new MockCommand({ context })

    const exitCode = await command.prepareAndRun({
      argv: ['abc', '-bcd', 'cde', '--def', '--', '--xyz']
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, 42, 'exit 42')

    const expectedErrorLines = [
      "warning: Argument 'abc' ignored", // 0
      "warning: Argument 'cde' ignored" // 1
    ]
    t.equal(mockConsole.errLines.length, expectedErrorLines.length,
      'error lines count')
    // Compare content, not object.
    t.same(mockConsole.errLines, expectedErrorLines, 'error lines')

    const expectedLines = [
      "argv[0]='abc'", // 0
      "argv[1]='-bcd'", // 1
      "argv[2]='cde'", // 2
      "argv[3]='--def'", // 3
      "argv[4]='--'", // 4
      "argv[5]='--xyz'" // 5
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('shouldFailOnUnknownOptions', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('The Xyz Title')
    commandsTree.shouldFailOnUnknownOptions = true

    context.commandNode = commandsTree

    const command = new MockCommand({ context })

    const exitCode = await command.prepareAndRun({
      argv: ['abc', '-bcd', 'cde', '--def', '--', '--xyz']
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, cli.ExitCodes.ERROR.SYNTAX, 'exit ERROR.SYNTAX')

    const expectedErrorLines = [
      "error: Option '-bcd' not supported", // 0
      "error: Option '--def' not supported", // 1
      "error: Option '--' not supported", // 2
      "error: Option '--xyz' not supported" // 3
    ]
    t.equal(mockConsole.errLines.length, expectedErrorLines.length,
      'error lines count')
    // Compare content, not object.
    t.same(mockConsole.errLines, expectedErrorLines, 'error lines')

    const expectedLines = [
      '', // 0
      'The Xyz Title', // 1
      '', // 2
      'Usage: xyz [options...]', // 3
      '', // 4
      "npm @scope/abc@1.2.3 '/a/b/c'" // 5
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')

    t.end()
  })

  await t.test('shouldFailOnExtraArguments', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('The Xyz Title')
    commandsTree.shouldFailOnExtraArguments = true

    context.commandNode = commandsTree

    const command = new MockCommand({ context })

    const exitCode = await command.prepareAndRun({
      argv: ['abc', '-bcd', 'cde', '--def', '--', '--xyz']
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(exitCode, cli.ExitCodes.ERROR.SYNTAX, 'exit ERROR.SYNTAX')

    const expectedErrorLines = [
      "error: Argument 'abc' not supported", // 0
      "error: Argument 'cde' not supported" // 1
    ]
    t.equal(mockConsole.errLines.length, expectedErrorLines.length,
      'error lines count')
    // Compare content, not object.
    t.same(mockConsole.errLines, expectedErrorLines, 'error lines')

    const expectedLines = [
      '', // 0
      'The Xyz Title', // 1
      '', // 2
      'Usage: xyz [options...]', // 3
      '', // 4
      "npm @scope/abc@1.2.3 '/a/b/c'" // 5
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

await test('cli.Command splitForwardableArguments()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log, programName: 'xyz' })
    const command = new MockCommand({ context })

    command.splitForwardableArguments(
      undefined as unknown as { argv: string[] }
    )
  }, assert.AssertionError, 'assert(params)')

  t.throws(() => {
    const context = new cli.Context({ log, programName: 'xyz' })
    const command = new MockCommand({ context })

    command.splitForwardableArguments({
      argv: undefined as unknown as string[]
    })
  }, assert.AssertionError, 'assert(params.argv)')

  t.throws(() => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const command = new MockCommand({ context })

    command.splitForwardableArguments({ argv: [] })
  }, assert.AssertionError, 'assert(context.commandNode)')

  await t.test('no forwardable args', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    // commandsTree.shouldSplitForwardableArguments = true

    context.commandNode = commandsTree

    const command = new MockCommand({ context })

    const { ownArgv, forwardableArgv } = command.splitForwardableArguments({
      argv: ['abc', '-bcd', 'cde', '--def', '--', '--xyz', 'yzw']
    })

    // dumpLines(ownArgv)
    // dumpLines(forwardableArgv)

    const expectedOwnArgv = [
      'abc', // 0
      '-bcd', // 1
      'cde', // 2
      '--def', // 3
      '--', // 4
      '--xyz', // 5
      'yzw' // 6
    ]

    t.equal(ownArgv.length, expectedOwnArgv.length,
      'ownArgv count')
    // Compare content, not object.
    t.same(ownArgv, expectedOwnArgv, 'ownArgv lines')

    t.equal(forwardableArgv.length, 0, 'no forwardableArgv')

    t.end()
  })

  await t.test('forwardable args', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.shouldSplitForwardableArguments = true

    context.commandNode = commandsTree

    const command = new MockCommand({ context })

    const { ownArgv, forwardableArgv } = command.splitForwardableArguments({
      argv: ['abc', '-bcd', 'cde', '--def', '--', '--xyz', 'yzw']
    })

    // dumpLines(ownArgv)
    // dumpLines(forwardableArgv)

    const expectedOwnArgv = [
      'abc', // 0
      '-bcd', // 1
      'cde', // 2
      '--def' // 3
    ]

    t.equal(ownArgv.length, expectedOwnArgv.length,
      'ownArgv count')
    // Compare content, not object.
    t.same(ownArgv, expectedOwnArgv, 'ownArgv lines')

    const expectedForwardableArgv = [
      '--xyz', // 0
      'yzw' // 1
    ]
    t.equal(forwardableArgv.length, expectedForwardableArgv.length,
      'forwardableArgv count')
    // Compare content, not object.
    t.same(forwardableArgv, expectedForwardableArgv, 'forwardableArgv lines')

    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------

await test('cli.Command getCommandDescription()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log, programName: 'xyz' })
    const command = new MockCommand({ context })

    command.getCommandDescription()
  }, assert.AssertionError, 'assert(this.context.commandNode)')

  const context = new cli.Context({ log, programName: 'xyz' })

  const commandsTree = new cli.CommandsTree({ context })
  const myTitle = 'The Xyz Title'
  commandsTree.setHelpDescription(myTitle)

  context.commandNode = commandsTree

  const command = new MockCommand({ context })

  const description: string = command.getCommandDescription()

  t.equal(description, myTitle, 'title')

  t.end()
})

// ----------------------------------------------------------------------------

await test('cli.Command outputDoneDuration()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log, programName: 'xyz' })
    const command = new MockCommand({ context })

    context.startTimestampMilliseconds = undefined as unknown as number
    command.outputDoneDuration()
  }, assert.AssertionError, 'assert(context.startTimestampMilliseconds)')

  t.throws(() => {
    const context = new cli.Context({ log, programName: 'xyz' })
    const command = new MockCommand({ context })

    context.startTimestampMilliseconds = 0
    command.outputDoneDuration()
  }, assert.AssertionError, 'assert(context.startTimestampMilliseconds)')

  t.throws(() => {
    const context = new cli.Context({ log })
    const command = new MockCommand({ context })

    context.programName = undefined as unknown as string

    command.outputDoneDuration()
  }, assert.AssertionError, 'assert(context.programName)')

  t.throws(() => {
    const context = new cli.Context({ log })
    const command = new MockCommand({ context })

    context.matchedCommands = undefined as unknown as string[]

    command.outputDoneDuration()
  }, assert.AssertionError, 'assert(context.matchedCommands)')

  await t.test('single command', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    const command = new MockCommand({ context })

    context.startTimestampMilliseconds = Date.now() - 12345
    command.outputDoneDuration()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      "'xyz' completed in 12.3 sec" // 1
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines content')
    t.end()
  })

  await t.test('sub-commands', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.matchedCommands = ['abc', 'cde']
    const command = new MockCommand({ context })

    context.startTimestampMilliseconds = Date.now() - 12345
    command.outputDoneDuration()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      "'xyz abc cde' completed in 12.3 sec" // 1
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

await test('cli.Command makePathAbsolute()', async (t) => {
  mockConsole.clear()

  const context = new cli.Context({ log, programName: 'xyz' })
  const command = new MockCommand({ context })

  await t.test('absolute', async (t) => {
    t.equal(command.makePathAbsolute('/a/b/c'), '/a/b/c', '/a/b/c')
    t.equal(command.makePathAbsolute('/a/b/./c'), '/a/b/c', '/a/b/./c')
    t.equal(command.makePathAbsolute('/a/b/../c'), '/a/c', '/a/b/../c')

    t.end()
  })

  await t.test('relative config.cwd', async (t) => {
    context.config.cwd = '/a/b/c'
    t.equal(command.makePathAbsolute('d/e/f'), '/a/b/c/d/e/f', 'd/e/f')
    t.equal(command.makePathAbsolute('d/e/./f'), '/a/b/c/d/e/f', 'd/e/./f')
    t.equal(command.makePathAbsolute('d/e/../f'), '/a/b/c/d/f', 'd/e/../f')

    t.end()
  })

  await t.test('relative processCwd', async (t) => {
    context.config.cwd = undefined as unknown as string
    context.processCwd = '/a/b/c'

    t.equal(command.makePathAbsolute('d/e/f'), '/a/b/c/d/e/f', 'd/e/f')
    t.equal(command.makePathAbsolute('d/e/./f'), '/a/b/c/d/e/f', 'd/e/./f')
    t.equal(command.makePathAbsolute('d/e/../f'), '/a/b/c/d/f', 'd/e/../f')

    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------

await test('cli.Command addGenerator()', async (t) => {
  t.throws(() => {
    const context = new cli.Context({ log, programName: 'xyz' })
    const command = new MockCommand({ context })

    command.addGenerator(
      undefined as unknown as any
    )
  }, assert.AssertionError, 'assert(params)')

  await t.test('without homepage', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })
    context.matchedCommands = ['abc']
    context.unparsedArgv = ['--opt']
    context.packageJson.version = '1.2.3'

    const command = new MockCommand({ context })

    const object: { generators?: cli.GeneratorDescription[] } = {}

    const currentDate: string = (new Date()).toISOString()
    const generator = command.addGenerator({ object })

    // console.log(generator)
    t.ok(object.generators !== undefined, 'generator exist')
    if (object.generators != null) {
      t.equal(object.generators?.length, 1, 'one generator')
      t.equal(object.generators[0], generator, 'equal')

      t.equal(generator.tool, 'xyz', 'tool')
      t.equal(generator.version, '1.2.3', 'version')
      t.same(generator.command, ['xyz', 'abc', '--opt'], 'command')
      t.equal(generator.date, currentDate, 'date')
      t.notOk(generator.homepage, 'no homepage')
    }
    t.end()
  })

  await t.test('with homepage', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })
    context.matchedCommands = ['abc']
    context.unparsedArgv = ['--opt']
    context.packageJson.version = '1.2.3'
    context.packageJson.homepage = 'https://abc.com'

    const command = new MockCommand({ context })

    const object: { generators?: cli.GeneratorDescription[] } = {}

    const currentDate: string = (new Date()).toISOString()
    const generator = command.addGenerator({ object })

    // console.log(generator)
    t.ok(object.generators !== undefined, 'generator exist')
    if (object.generators != null) {
      t.equal(object.generators?.length, 1, 'one generator')
      t.equal(object.generators[0], generator, 'equal')

      t.equal(generator.tool, 'xyz', 'tool')
      t.equal(generator.version, '1.2.3', 'version')
      t.same(generator.command, ['xyz', 'abc', '--opt'], 'command')
      t.equal(generator.date, currentDate, 'date')
      t.equal(generator.homepage, 'https://abc.com', 'generator')
    }
    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------

await test('cli.DerivedCommand', async (t) => {
  mockConsole.clear()

  const context = new cli.Context({ log, programName: 'xyz' })

  const commandsTree = new cli.CommandsTree({ context })
  commandsTree.setHelpDescription('The Xyz Title')

  context.commandNode = commandsTree

  const command = new cli.DerivedCommand({ context })
  const exitCode = await command.prepareAndRun({ argv: [] })

  // dumpLines(mockConsole.errLines)
  // dumpLines(mockConsole.outLines)

  t.equal(exitCode, cli.ExitCodes.SUCCESS, 'exit SUCCESS')
  t.equal(mockConsole.errLines.length, 0, 'no error lines')
  t.equal(mockConsole.outLines.length, 0, 'no output lines')

  t.end()
})

// ----------------------------------------------------------------------------
