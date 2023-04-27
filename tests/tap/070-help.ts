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
dumpLines()

// ----------------------------------------------------------------------------

await test('cli.Help constructor()', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })

  t.throws(() => {
    const help = new cli.Help(undefined as unknown as cli.HelpConstructorParams)
    assert(help)
  }, assert.AssertionError, 'assert(params)')

  t.throws(() => {
    const help = new cli.Help({
      context: undefined as unknown as cli.Context
    })
    assert(help)
  }, assert.AssertionError, 'assert(params.context)')

  const context = new cli.Context({ log })

  const help = new cli.Help({ context })

  t.ok(help.middleLimit > 0, 'middleLimit > 0')
  t.ok(help.rightLimit > 0, 'rightLimit > 0')
  t.ok(help.rightLimit > help.middleLimit, 'rightLimit > middleLimit')

  t.end()
})

await test('cli.Help output()', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })
  const context = new cli.Context({ log })

  const help = new cli.Help({ context })

  await t.test('log info', async (t) => {
    help.output('info')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'info', 'content: info')

    t.end()
  })

  mockConsole.clear()

  await t.test('log silent', async (t) => {
    log.level = 'silent'
    help.output('silent')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  mockConsole.clear()

  const helpAlways = new cli.Help({
    context,
    isOutputAlways: true
  })

  await t.test('always, log info', async (t) => {
    helpAlways.output('info')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'info', 'content: info')

    t.end()
  })

  mockConsole.clear()

  await t.test('always, log silent', async (t) => {
    log.level = 'silent'
    helpAlways.output('silent')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'silent', 'content: silent')

    t.end()
  })

  t.end()
})

await test('cli.Help outputTitle()', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputTitle()
  }, assert.AssertionError, 'outputTitle assert(context.commandNode)')

  mockConsole.clear()

  await t.test('my title', async (t) => {
    const context = new cli.Context({ log })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('My Title')

    context.commandNode = commandsTree

    const help = new cli.Help({ context })

    help.outputTitle()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      'My Title', // 0
      '' // 1
    ]
    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('empty title', async (t) => {
    const context = new cli.Context({ log })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.setHelpDescription('')

    context.commandNode = commandsTree

    const help = new cli.Help({ context })

    help.outputTitle()

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  t.end()
})

await test('cli.Help outputCommandLine()', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputCommandLine()
  }, assert.AssertionError, 'outputCommandLine assert(context.commandNode)')

  mockConsole.clear()

  await t.test('empty', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    // Root tree node, practically empty.
    context.commandNode = commandsTree

    const help = new cli.Help({ context })

    help.outputCommandLine()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      'Usage: xyz [options...]' // 0
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  const commandsTemplate: {
    [key: string]: cli.CommandTemplate
  } = {
    one: {
      moduleRelativePath: '.',
      subCommands: {
        two: {
          moduleRelativePath: '.'
        }
      }
    }
  }

  await t.test('commands', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands(commandsTemplate)
    // commandsTree.validateCommands()
    context.commandNode = commandsTree.findCommandNode(['one', 'two'])

    const help = new cli.Help({ context })

    help.outputCommandLine()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      'Usage: xyz one two [options...]' // 0
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('pre/post options', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.helpDefinitions = {
      description: 'My Title',
      usagePreOptions: 'pre',
      usagePostOptions: 'post'
    }
    context.commandNode = commandsTree

    const help = new cli.Help({ context })

    help.outputCommandLine()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      'Usage: xyz pre [options...] post' // 0
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('options', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    context.commandNode = commandsTree
    commandsTree.helpDefinitions = {
      description: 'My Title',
      usagePreOptions: 'pre',
      usagePostOptions: 'post'
    }
    const options = new cli.Options({ context })
    options.addGroups([
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['-o', '--one'],
            init: () => { },
            action: () => { }
          },
          {
            options: ['--two'],
            init: () => { },
            action: () => { },
            hasValue: true
          },
          {
            options: ['--three'],
            init: () => { },
            action: () => { },
            hasValue: true,
            helpDefinitions: {
              valueDescription: 'desc'
            }
          },
          {
            options: ['--four'],
            init: () => { },
            action: () => { },
            hasValue: true,
            isMandatory: true
          },
          {
            options: ['--five'],
            init: () => { },
            action: () => { },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              valueDescription: 'desc'
            }
          },
          {
            options: ['--one-multi'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              isMultiple: true
            }
          },
          {
            options: ['--two-multi'],
            init: () => { },
            action: () => { },
            hasValue: true,
            helpDefinitions: {
              isMultiple: true
            }
          },
          {
            options: ['--three-multi'],
            init: () => { },
            action: () => { },
            hasValue: true,
            helpDefinitions: {
              valueDescription: 'desc',
              isMultiple: true
            }
          },
          {
            options: ['--four-multi'],
            init: () => { },
            action: () => { },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              isMultiple: true
            }
          },
          {
            options: ['--five-multi'],
            init: () => { },
            action: () => { },
            hasValue: true,
            isMandatory: true,
            helpDefinitions: {
              valueDescription: 'desc',
              isMultiple: true
            }
          }
        ]
      }
    ])
    context.options = options

    const help = new cli.Help({ context })

    help.outputCommandLine()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      'Usage: xyz pre [options...] [--one] [--two <s>] [--three <desc>] --four <s>', // 0
      '           --five <desc> [--one-multi]* [--two-multi <s>]*', // 1
      '           [--three-multi <desc>]* [--four-multi <s>]+ [--five-multi <desc>]+', // 2
      '           post' // 3
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

await test('cli.Help outputAvailableCommands()', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputAvailableCommands()
  }, assert.AssertionError, 'assert(context.commandNode)')

  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log })

    const commandsTree = new cli.CommandsTree({ context })
    // Root tree node, practically empty.
    context.commandNode = commandsTree

    const help = new cli.Help({ context })
    help.outputAvailableCommands()
  }, assert.AssertionError, 'assert(commands.length > 0)')

  mockConsole.clear()

  await t.test('top commands', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        moduleRelativePath: '.'
      },
      two: {
        moduleRelativePath: '.'
      },
      three: {
        moduleRelativePath: '.'
      },
      four: {
        moduleRelativePath: '.'
      },
      five: {
        moduleRelativePath: '.'
      },
      six: {
        moduleRelativePath: '.'
      },
      seven: {
        moduleRelativePath: '.'
      },
      eight: {
        moduleRelativePath: '.'
      },
      nine: {
        moduleRelativePath: '.'
      },
      ten: {
        moduleRelativePath: '.'
      },
      eleven: {
        moduleRelativePath: '.'
      },
      twelve: {
        moduleRelativePath: '.'
      },
      thirteen: {
        moduleRelativePath: '.'
      }
    })
    context.commandNode = commandsTree

    const help = new cli.Help({ context })

    help.outputAvailableCommands()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      'Usage: xyz <command> [<subcommand>...] [<options> ...] [<args>...]', // 0
      '', // 1
      'where <command> is one of:', // 2
      '  eight, eleven, five, four, nine, one, seven, six, ten, thirteen, three, twelve, ', // 3
      '  two' // 4
    ]
    /* eslint-enable max-len */

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('sub-commands', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      top: {
        moduleRelativePath: '.',
        subCommands: {
          one: {
            moduleRelativePath: '.'
          },
          two: {
            moduleRelativePath: '.'
          }
        }
      }
    })
    context.commandNode = commandsTree.findCommandNode(['top'])

    const help = new cli.Help({ context })

    help.outputAvailableCommands()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      'Usage: xyz top <command> [<subcommand>...] [<options> ...] [<args>...]', // 0
      '', // 1
      'where <command> is one of:', // 2
      '  one, two' // 3
    ]
    /* eslint-enable max-len */

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('post options', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        moduleRelativePath: '.'
      },
      two: {
        moduleRelativePath: '.'
      }
    })
    commandsTree.helpDefinitions = {
      description: 'My Title',
      usagePreOptions: 'pre', // ignored
      usagePostOptions: 'post'
    }
    context.commandNode = commandsTree

    const help = new cli.Help({ context })

    help.outputAvailableCommands()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      'Usage: xyz <command> [<subcommand>...] [<options> ...] post', // 0
      '', // 1
      'where <command> is one of:', // 2
      '  one, two' // 3
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  t.end()
})

await test('cli.Help outputCommandAliases()', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputCommandAliases()
  }, assert.AssertionError, 'assert(context.commandNode)')

  mockConsole.clear()

  await t.test('no aliases', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        moduleRelativePath: '.'
      },
      two: {
        moduleRelativePath: '.'
      }
    })
    context.commandNode = commandsTree.findCommandNode(['one'])

    const help = new cli.Help({ context })

    help.outputCommandAliases()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.equal(mockConsole.outLines.length, 0, 'no output line')

    t.end()
  })

  await t.test('aliases', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        aliases: ['o', 'on'],
        moduleRelativePath: '.'
      },
      two: {
        moduleRelativePath: '.'
      }
    })
    context.commandNode = commandsTree.findCommandNode(['one'])

    const help = new cli.Help({ context })

    help.outputCommandAliases()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      'Command aliases: o, on' // 1
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  t.end()
})

await test('cli.Help outputFooter()', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputFooter()
  }, assert.AssertionError, 'assert(context.rootPath)')

  mockConsole.clear()

  await t.test('npm details', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'

    const help = new cli.Help({ context })

    help.outputFooter()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      "npm @scope/abc@1.2.3 '/a/b/c'" // 1
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('home page', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'
    context.packageJson.homepage = 'https://home.page.com'

    const help = new cli.Help({ context })

    help.outputFooter()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      "npm @scope/abc@1.2.3 '/a/b/c'", // 1
      'Home page: <https://home.page.com>' // 2
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('bug url', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'
    context.packageJson.bugs = { url: 'https://bugs.page.com' }

    const help = new cli.Help({ context })

    help.outputFooter()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      "npm @scope/abc@1.2.3 '/a/b/c'", // 1
      'Bug reports: <https://bugs.page.com>' // 2
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('bug author name & email', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'
    context.packageJson.author = {
      name: 'First Last',
      email: 'first.last@gmail.com'
    }

    const help = new cli.Help({ context })

    help.outputFooter()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      "npm @scope/abc@1.2.3 '/a/b/c'", // 1
      'Bug reports: First Last <first.last@gmail.com>' // 2
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('bug author email', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'
    context.packageJson.author = {
      email: 'first.last@gmail.com'
    }

    const help = new cli.Help({ context })

    help.outputFooter()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      "npm @scope/abc@1.2.3 '/a/b/c'", // 1
      'Bug reports: <first.last@gmail.com>' // 2
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('bug author string', async (t) => {
    const context = new cli.Context({ log, programName: 'xyz' })

    context.rootPath = '/a/b/c'
    context.packageJson.name = '@scope/abc'
    context.packageJson.version = '1.2.3'
    context.packageJson.author = 'First Last <first.last@gmail.com>'

    const help = new cli.Help({ context })

    help.outputFooter()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      "npm @scope/abc@1.2.3 '/a/b/c'", // 1
      'Bug reports: First Last <first.last@gmail.com>' // 2
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------

class MockHelpApplicationRegular extends cli.Help {
  override outputAlignedCustomOptions (): void {
    const multiPass = this.multiPass

    if (multiPass.isSecondPass) {
      this.output()
      this.output('Top Custom Options:')
    }
    const line = '  --mock-option-top'
    this.outputMultiPassLine({ line, description: 'Mock application option' })
  }
}

class MockHelpApplicationLong extends cli.Help {
  override outputAlignedCustomOptions (): void {
    const multiPass = this.multiPass

    if (multiPass.isSecondPass) {
      this.output()
      this.output('Top Custom Options:')
    }
    const line = '  --mock-option-top|--a-very-very-very-long-option'
    this.outputMultiPassLine({ line, description: 'Mock application option' })
  }
}

class MockHelpCommandOne extends cli.Help {
  override outputAlignedCustomOptions (): void {
    const multiPass = this.multiPass

    if (multiPass.isSecondPass) {
      this.output()
      this.output('One Custom Options:')
    }
    const line = '  --mock-option'
    this.outputMultiPassLine({ line, description: 'Mock command option' })
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
}

await test('cli.Help outputAll', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputAll()
  }, assert.AssertionError, 'assert(context.commandNode)')

  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log })

    const commandsTree = new cli.CommandsTree({ context })
    // Root tree node, practically empty.
    context.commandNode = commandsTree

    const help = new cli.Help({ context })
    help.outputAll()
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

    const help = new cli.Help({ context })

    help.outputAll()

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

    const mockApplication = new cli.Application({ context })
    assert(mockApplication)

    const help = new MockHelpApplicationRegular({ context })

    help.outputAll()

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

    const mockApplication = new cli.Application({ context })
    assert(mockApplication)

    const help = new MockHelpApplicationLong({ context })

    help.outputAll()

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
    assert(mockCommand)

    const help = new MockHelpCommandOne({ context })

    help.outputAll()

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
