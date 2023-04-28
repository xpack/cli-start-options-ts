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

class MockApplicationRegular extends cli.Application {
  override outputAlignedCustomOptions (): void {
    const context: cli.Context = this.context
    assert(context.help)
    const help: cli.Help = context.help
    const multiPass = help.multiPass

    if (multiPass.isSecondPass) {
      help.output()
      help.output('Top Custom Options:')
    }
    const line = '  --mock-option-top'
    help.outputMultiPassLine({ line, description: 'Mock application option' })
  }
}

class MockApplicationLong extends cli.Application {
  override outputAlignedCustomOptions (): void {
    const context: cli.Context = this.context
    assert(context.help)
    const help: cli.Help = context.help
    const multiPass = help.multiPass

    if (multiPass.isSecondPass) {
      help.output()
      help.output('Top Custom Options:')
    }
    const line = '  --mock-option-top|--a-very-very-very-long-option'
    help.outputMultiPassLine({ line, description: 'Mock application option' })
  }
}

class MockCommandOne extends cli.Command {
  constructor (params: cli.CommandConstructorParams) {
    super(params)

    this.context.options.addGroups([
      {
        description: 'One options',
        optionsDefinitions: [
          {
            options: ['-o', '--out'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            helpDefinitions: {
              description: 'Opt file',
              valueDescription: 'file'
            }
          },
          {
            options: ['--opt'],
            init: (_context) => { },
            action: (_context, _val) => { },
            helpDefinitions: {
              description: 'Opt'
            }
          },
          {
            options: ['--opt-str'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            helpDefinitions: {
              description: 'Opt string'
            }
          },
          {
            options: ['--opt-str-multiple'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            helpDefinitions: {
              description: 'Opt string multiple',
              isMultiple: true
            }
          },
          {
            options: ['--opt-multiple'],
            init: (_context) => { },
            action: (_context, _val) => { },
            helpDefinitions: {
              description: 'Opt string multiple',
              isMultiple: true
            }
          },
          {
            options: ['--opt-str-default'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            helpDefinitions: {
              description: 'Opt string with default',
              defaultValueDescription: 'ddd'
            }
          },
          {
            options: ['--opt-str-default-multi'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            helpDefinitions: {
              description: 'Opt string with default multi',
              defaultValueDescription: 'ddd',
              isMultiple: true
            }
          },

          {
            options: ['--opt-str-mandatory'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              description: 'Opt string mandatory'
            }
          },
          {
            options: ['--opt-str-multiple-mandatory'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              description: 'Opt string multiple mandatory',
              isMultiple: true
            }
          },
          {
            options: ['--opt-str-default-mandatory'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              description: 'Opt string with default mandatory',
              defaultValueDescription: 'ddd'
            }
          },
          {
            options: ['--opt-str-default-multi-mandatory'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              description: 'Opt string with default multi mandatory',
              defaultValueDescription: 'ddd',
              isMultiple: true
            }
          },

          {
            options: ['--opt-values'],
            init: (_context) => { },
            action: (_context, _val) => { },
            values: ['one', 'two'],
            helpDefinitions: {
              description: 'Opt values'
            }
          },
          {
            options: ['--opt-values-multi'],
            init: (_context) => { },
            action: (_context, _val) => { },
            values: ['one', 'two'],
            helpDefinitions: {
              description: 'Opt values multiple',
              isMultiple: true
            }
          },
          {
            options: ['--opt-values-default'],
            init: (_context) => { },
            action: (_context, _val) => { },
            values: ['one', 'two'],
            helpDefinitions: {
              description: 'Opt values with default',
              defaultValueDescription: 'one'
            }
          },
          {
            options: ['--opt-values-default-multi'],
            init: (_context) => { },
            action: (_context, _val) => { },
            values: ['one', 'two'],
            helpDefinitions: {
              description: 'Opt values with default multi',
              defaultValueDescription: 'one',
              isMultiple: true
            }
          },

          {
            options: ['--opt-values-mandatory'],
            init: (_context) => { },
            action: (_context, _val) => { },
            values: ['one', 'two'],
            isMandatory: true,
            helpDefinitions: {
              description: 'Opt values mandatory'
            }
          },
          {
            options: ['--opt-values-multi-mandatory'],
            init: (_context) => { },
            action: (_context, _val) => { },
            values: ['one', 'two'],
            isMandatory: true,
            helpDefinitions: {
              description: 'Opt values multiple mandatory',
              isMultiple: true
            }
          },
          {
            options: ['--opt-values-default-mandatory'],
            init: (_context) => { },
            action: (_context, _val) => { },
            values: ['one', 'two'],
            isMandatory: true,
            helpDefinitions: {
              description: 'Opt values with default mandatory',
              defaultValueDescription: 'one'
            }
          },
          {
            options: ['--opt-values-default-multi-mandatory'],
            init: (_context) => { },
            action: (_context, _val) => { },
            values: ['one', 'two'],
            isMandatory: true,
            helpDefinitions: {
              description: 'Opt values with default multi mandatory',
              defaultValueDescription: 'one',
              isMultiple: true
            }
          },
          {
            options: ['--opt-str-very-very-very-very-very-long'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            helpDefinitions: {
              description: 'Opt string long'
            }
          },
          {
            options: ['-E', '--opt-early-cmd'],
            init: (_context) => { },
            action: (_context, _val) => { },
            helpDefinitions: {
              description: 'Opt early command',
              isRequiredEarly: true
            }
          },
          {
            options: ['-x', '--opt-early-cmd-nodesc'],
            init: (_context) => { },
            action: (_context, _val) => { },
            helpDefinitions: {
              isRequiredEarly: true
            }
          },
          {
            options: ['-H', '--opt-help-cmd'],
            init: (_context) => { },
            action: (_context, _val) => { },
            helpDefinitions: {
              description: 'Opt help command',
              isHelp: true
            }
          },

          {
            // Not shown.
            options: ['--opt-no-desc'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            helpDefinitions: {
            }
          }
        ]
      },
      {
        description: 'Common options',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['-e', '--opt-early'],
            init: (_context) => { },
            action: (_context, _val) => { },
            helpDefinitions: {
              description: 'Opt early',
              isRequiredEarly: true
            }
          },
          {
            options: ['-h', '--opt-help'],
            init: (_context) => { },
            action: (_context, _val) => { },
            helpDefinitions: {
              description: 'Opt help',
              isHelp: true
            }
          }
        ]
      },
      {
        description: 'Options without description',
        optionsDefinitions: [
          {
            options: ['--no-description'],
            init: (_context) => { },
            action: (_context, _val) => { },
            helpDefinitions: {
            }
          }
        ]
      },
      {
        description: 'Options without help',
        optionsDefinitions: [
          {
            options: ['--no-help'],
            init: (_context) => { },
            action: (_context, _val) => { }
          }
        ]
      }
    ])
  }

  async main (
    _argv: string[],
    _forwardableArgv?: string[] | undefined
  ): Promise<number> {
    throw new Error('Method not implemented.')
  }

  override outputAlignedCustomOptions (): void {
    const context: cli.Context = this.context
    assert(context.help)
    const help: cli.Help = context.help
    const multiPass = help.multiPass

    if (multiPass.isSecondPass) {
      help.output()
      help.output('One Custom Options:')
    }

    const line = '  --mock-option'
    help.outputMultiPassLine({ line, description: 'Mock command option' })
  }
}

await test('cli.Command outputHelp', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })

  t.throws(() => {
    const context = new cli.Context({ log })

    const command = new MockCommand({ context })
    command.outputHelp()
  }, assert.AssertionError, 'assert(context.commandNode)')

  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log })

    const commandsTree = new cli.CommandsTree({ context })
    // Root tree node, practically empty.
    context.commandNode = commandsTree

    const command = new MockCommand({ context })
    command.outputHelp()
  }, assert.AssertionError, 'assert(context.commandNode.helpDefinitions)')

  mockConsole.clear()

  await t.test('top commands default', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        moduleRelativePath: '.'
      },
      two: {
        moduleRelativePath: '.'
      }
    })

    // Root tree node, practically empty.
    context.commandNode = commandsTree

    commandsTree.helpDefinitions = {
      description: 'Mock Top Description'
    }

    const mockApplication = new cli.Application({ context })
    assert(mockApplication)

    mockApplication.outputHelp()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      '', //  0
      'Mock Top Description', //  1
      '', //  2
      'Usage: xyz <command> [<subcommand>...] [<options> ...] [<args>...]', //  3
      '', //  4
      'where <command> is one of:', //  5
      '  one, two', //  6
      '', //  7
      'Common options:', //  8
      '  --loglevel <level>     Set log level (silent|warn|info|verbose|debug|trace) (optional)', //  9
      '  -s|--silent            Disable all messages (--loglevel silent) (optional)', // 10
      '  -q|--quiet             Mostly quiet, warnings and errors (--loglevel warn) (optional)', // 11
      '  --informative          Informative (--loglevel info) (optional)', // 12
      '  -v|--verbose           Verbose (--loglevel verbose) (optional)', // 13
      '  -d|--debug             Debug messages (--loglevel debug) (optional)', // 14
      '  -dd|--trace            Trace messages (--loglevel trace, -d -d) (optional)', // 15
      '  --no-update-notifier   Skip check for a more recent version (optional)', // 16
      '  -C <folder>            Set current folder (optional)', // 17
      '', // 18
      'xyz -h|--help            Quick help', // 19
      'xyz <command> -h|--help  Quick help for command', // 20
      'xyz --version            Show version', // 21
      '', // 22
      "npm @scope/abc@1.2.3 '/a/b/c'" // 23
    ]
    /* eslint-enable max-len */

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('top commands regular', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        moduleRelativePath: '.'
      },
      two: {
        moduleRelativePath: '.'
      }
    })

    // Root tree node, practically empty.
    context.commandNode = commandsTree

    commandsTree.helpDefinitions = {
      description: 'Mock Top Description'
    }

    const mockApplication = new MockApplicationRegular({ context })
    assert(mockApplication)

    mockApplication.outputHelp()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      '', //  0
      'Mock Top Description', //  1
      '', //  2
      'Usage: xyz <command> [<subcommand>...] [<options> ...] [<args>...]', //  3
      '', //  4
      'where <command> is one of:', //  5
      '  one, two', //  6
      '', //  7
      'Top Custom Options:', //  8
      '  --mock-option-top      Mock application option', //  9
      '', // 10
      'Common options:', // 11
      '  --loglevel <level>     Set log level (silent|warn|info|verbose|debug|trace) (optional)', // 12
      '  -s|--silent            Disable all messages (--loglevel silent) (optional)', // 13
      '  -q|--quiet             Mostly quiet, warnings and errors (--loglevel warn) (optional)', // 14
      '  --informative          Informative (--loglevel info) (optional)', // 15
      '  -v|--verbose           Verbose (--loglevel verbose) (optional)', // 16
      '  -d|--debug             Debug messages (--loglevel debug) (optional)', // 17
      '  -dd|--trace            Trace messages (--loglevel trace, -d -d) (optional)', // 18
      '  --no-update-notifier   Skip check for a more recent version (optional)', // 19
      '  -C <folder>            Set current folder (optional)', // 20
      '', // 21
      'xyz -h|--help            Quick help', // 22
      'xyz <command> -h|--help  Quick help for command', // 23
      'xyz --version            Show version', // 24
      '', // 25
      "npm @scope/abc@1.2.3 '/a/b/c'" // 26
    ]
    /* eslint-enable max-len */

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('top commands long', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        moduleRelativePath: '.'
      },
      two: {
        moduleRelativePath: '.'
      }
    })

    // Root tree node, practically empty.
    context.commandNode = commandsTree

    commandsTree.helpDefinitions = {
      description: 'Mock Top Description'
    }

    const mockApplication = new MockApplicationLong({ context })
    assert(mockApplication)

    mockApplication.outputHelp()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      '', //  0
      'Mock Top Description', //  1
      '', //  2
      'Usage: xyz <command> [<subcommand>...] [<options> ...] [<args>...]', //  3
      '', //  4
      'where <command> is one of:', //  5
      '  one, two', //  6
      '', //  7
      'Top Custom Options:', //  8
      '  --mock-option-top|--a-very-very-very-long-option', //  9
      '                                         Mock application option', // 10
      '', // 11
      'Common options:', // 12
      '  --loglevel <level>                     Set log level (silent|warn|info|verbose|debug|trace) (optional)', // 13
      '  -s|--silent                            Disable all messages (--loglevel silent) (optional)', // 14
      '  -q|--quiet                             Mostly quiet, warnings and errors (--loglevel warn) (optional)', // 15
      '  --informative                          Informative (--loglevel info) (optional)', // 16
      '  -v|--verbose                           Verbose (--loglevel verbose) (optional)', // 17
      '  -d|--debug                             Debug messages (--loglevel debug) (optional)', // 18
      '  -dd|--trace                            Trace messages (--loglevel trace, -d -d) (optional)', // 19
      '  --no-update-notifier                   Skip check for a more recent version (optional)', // 20
      '  -C <folder>                            Set current folder (optional)', // 21
      '', // 22
      'xyz -h|--help                            Quick help', // 23
      'xyz <command> -h|--help                  Quick help for command', // 24
      'xyz --version                            Show version', // 25
      '', // 26
      "npm @scope/abc@1.2.3 '/a/b/c'" // 27
    ]
    /* eslint-enable max-len */

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('sub-command one', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        aliases: ['o', 'on'],
        moduleRelativePath: '.',
        helpDefinitions: {
          description: 'Mock One Description'
        }
      },
      two: {
        moduleRelativePath: '.'
      }
    })

    context.commandNode = commandsTree.findCommandNode(['one'])

    const mockCommand = new MockCommandOne({ context })

    mockCommand.outputHelp()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      '', //  0
      'Mock One Description', //  1
      '', //  2
      'Usage: xyz one [options...] [--out <file>] [--opt] [--opt-str <s>]', //  3
      '               [--opt-str-multiple <s>]* [--opt-multiple]*', //  4
      '               [--opt-str-default <s>] [--opt-str-default-multi <s>]*', //  5
      '               --opt-str-mandatory <s> [--opt-str-multiple-mandatory <s>]+', //  6
      '               --opt-str-default-mandatory <s>', //  7
      '               [--opt-str-default-multi-mandatory <s>]+ [--opt-values <s>]', //  8
      '               [--opt-values-multi <s>]* [--opt-values-default <s>]', //  9
      '               [--opt-values-default-multi <s>]* --opt-values-mandatory <s>', // 10
      '               [--opt-values-multi-mandatory <s>]+', // 11
      '               --opt-values-default-mandatory <s>', // 12
      '               [--opt-values-default-multi-mandatory <s>]+', // 13
      '               [--opt-str-very-very-very-very-very-long <s>]', // 14
      '               [--opt-no-desc <s>] [--no-description] [--no-help]', // 15
      '', // 16
      'Command aliases: o, on', // 17
      '', // 18
      'One Custom Options:', // 19
      '  --mock-option                          Mock command option', // 20
      '', // 21
      'One options:', // 22
      '  -o|--out <file>                        Opt file (optional)', // 23
      '  --opt                                  Opt (optional)', // 24
      '  --opt-str <s>                          Opt string (optional)', // 25
      '  --opt-str-multiple <s>                 Opt string multiple (optional, multiple)', // 26
      '  --opt-multiple                         Opt string multiple (optional, multiple)', // 27
      '  --opt-str-default <s>                  Opt string with default (optional, default ddd)', // 28
      '  --opt-str-default-multi <s>            Opt string with default multi (optional, multiple, default ddd)', // 29
      '  --opt-str-mandatory <s>                Opt string mandatory', // 30
      '  --opt-str-multiple-mandatory <s>       Opt string multiple mandatory (multiple)', // 31
      '  --opt-str-default-mandatory <s>        Opt string with default mandatory', // 32
      '  --opt-str-default-multi-mandatory <s>  Opt string with default multi mandatory (multiple)', // 33
      '  --opt-values <s>                       Opt values (one|two) (optional)', // 34
      '  --opt-values-multi <s>                 Opt values multiple (one|two) (optional, multiple)', // 35
      '  --opt-values-default <s>               Opt values with default (one|two) (optional, default one)', // 36
      '  --opt-values-default-multi <s>         Opt values with default multi (one|two) (optional, multiple, default one)', // 37
      '  --opt-values-mandatory <s>             Opt values mandatory (one|two)', // 38
      '  --opt-values-multi-mandatory <s>       Opt values multiple mandatory (one|two) (multiple)', // 39
      '  --opt-values-default-mandatory <s>     Opt values with default mandatory (one|two)', // 40
      '  --opt-values-default-multi-mandatory <s>', // 41
      '                                         Opt values with default multi mandatory (one|two) (multiple)', // 42
      '  --opt-str-very-very-very-very-very-long <s>', // 43
      '                                         Opt string long (optional)', // 44
      '', // 45
      'xyz -H|--opt-help-cmd                    Opt help command', // 46
      'xyz -h|--opt-help                        Opt help', // 47
      'xyz -E|--opt-early-cmd                   Opt early command', // 48
      'xyz -e|--opt-early                       Opt early', // 49
      '', // 50
      "npm @scope/abc@1.2.3 '/a/b/c'" // 51
    ]
    /* eslint-enable max-len */

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

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
