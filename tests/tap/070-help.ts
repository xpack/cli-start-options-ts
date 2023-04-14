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

await test('cli.Help constructor()', async (t) => {
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })
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

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'info', 'content: info')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('log silent', async (t) => {

    log.level = 'silent'
    help.output('silent')

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 0, 'no output lines')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.end()
  })

  mockConsole.clear()

  const helpAlways = new cli.Help({ context, isOutputAlways: true })

  await t.test('always, log info', async (t) => {

    helpAlways.output('info')

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'info', 'content: info')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('always, log silent', async (t) => {

    log.level = 'silent'
    helpAlways.output('silent')

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'silent', 'content: silent')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

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

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 2, 'two output lines')
    t.equal(mockConsole.outLines[0], 'My Title', 'first line: My Title')
    t.equal(mockConsole.outLines[1], '', 'second line: empty')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

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

    t.equal(mockConsole.outLines.length, 0, 'no output lines')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

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

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'Usage: xyz [options...]',
      'content: Usage: xyz')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.end()
  })

  mockConsole.clear()

  const commandsTemplate: {
    [key: string]: cli.CommandTemplate;
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

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'Usage: xyz one two [options...]',
      'content: Usage: xyz one two')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

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

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'Usage: xyz pre [options...] post',
      'content: Usage: xyz pre post')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

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
            },
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
            },
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
            },
          },
        ]
      }
    ])
    context.options = options

    const help = new cli.Help({ context })

    help.outputCommandLine()

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 4, 'four output lines')
    t.equal(mockConsole.outLines[0],
      'Usage: xyz pre [options...] [--one] [--two <s>]' +
      ' [--three <desc>] --four <s>',
      'first line: Usage: xyz ...')
    t.equal(mockConsole.outLines[1],
      '           --five <desc> [--one-multi]* [--two-multi <s>]*',
      'second line: ... --five ...')
    t.equal(mockConsole.outLines[2],
      '           [--three-multi <desc>]* [--four-multi <s>]+' +
      ' [--five-multi <desc>]+',
      'third line: ... [--three ...')
    t.equal(mockConsole.outLines[3],
      '           post',
      'fourth line: ... post')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

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
        moduleRelativePath: '.',
      },
      two: {
        moduleRelativePath: '.',
      },
      three: {
        moduleRelativePath: '.',
      },
      four: {
        moduleRelativePath: '.',
      },
      five: {
        moduleRelativePath: '.',
      },
      six: {
        moduleRelativePath: '.',
      },
      seven: {
        moduleRelativePath: '.',
      },
      eight: {
        moduleRelativePath: '.',
      },
      nine: {
        moduleRelativePath: '.',
      },
      ten: {
        moduleRelativePath: '.',
      },
      eleven: {
        moduleRelativePath: '.',
      },
      twelve: {
        moduleRelativePath: '.',
      },
      thirteen: {
        moduleRelativePath: '.',
      }
    })
    context.commandNode = commandsTree

    const help = new cli.Help({ context })

    help.outputAvailableCommands()

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 5, 'five output line')
    t.equal(mockConsole.outLines[0],
      'Usage: xyz <command> [<subcommand>...] [<options> ...] [<args>...]',
      'first line: Usage: xyz ...')
    t.equal(mockConsole.outLines[1],
      '',
      'second line: empty')
    t.equal(mockConsole.outLines[2], 'where <command> is one of:',
      'third line: where <command> ...')
    t.equal(mockConsole.outLines[3],
      '  eight, eleven, five, four, nine, one, seven, six, ten, thirteen, ' +
      'three, twelve, ',
      'fourth line: eight, eleven...')
    t.equal(mockConsole.outLines[4], '  two',
      'fifth line: two')

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

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
            moduleRelativePath: '.',
          },
          two: {
            moduleRelativePath: '.',
          }
        }
      }
    })
    context.commandNode = commandsTree.findCommandNode(['top'])

    const help = new cli.Help({ context })

    help.outputAvailableCommands()

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 4, 'four output line')
    t.equal(mockConsole.outLines[0],
      'Usage: xyz top <command> [<subcommand>...] [<options> ...] [<args>...]',
      'first line: Usage: xyz ...')
    t.equal(mockConsole.outLines[1],
      '',
      'second line: empty')
    t.equal(mockConsole.outLines[2], 'where <command> is one of:',
      'third line: where <command> ...')
    t.equal(mockConsole.outLines[3],
      '  one, two',
      'fourth line: one, two')

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.end()
  })

  mockConsole.clear()

  await t.test('post options', async (t) => {

    const context = new cli.Context({ log, programName: 'xyz' })
    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        moduleRelativePath: '.',
      },
      two: {
        moduleRelativePath: '.',
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

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 4, 'four output line')
    t.equal(mockConsole.outLines[0],
      'Usage: xyz <command> [<subcommand>...] [<options> ...] post',
      'first line: Usage: xyz ...')
    t.equal(mockConsole.outLines[1],
      '',
      'second line: empty')
    t.equal(mockConsole.outLines[2], 'where <command> is one of:',
      'third line: where <command> ...')
    t.equal(mockConsole.outLines[3],
      '  one, two',
      'fourth line: one two')

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

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
        moduleRelativePath: '.',
      },
      two: {
        moduleRelativePath: '.',
      }
    })
    context.commandNode = commandsTree.findCommandNode(['one'])

    const help = new cli.Help({ context })

    help.outputCommandAliases()

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 0, 'no output line')
    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.end()
  })

  await t.test('aliases', async (t) => {

    const context = new cli.Context({ log, programName: 'xyz' })
    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      one: {
        aliases: ['o', 'on'],
        moduleRelativePath: '.',
      },
      two: {
        moduleRelativePath: '.',
      }
    })
    context.commandNode = commandsTree.findCommandNode(['one'])

    const help = new cli.Help({ context })

    help.outputCommandAliases()

    // dumpLines(mockConsole.outLines)
    // dumpLines(mockConsole.errLines)

    t.equal(mockConsole.outLines.length, 2, 'two output lines')
    t.equal(mockConsole.outLines[0],
      '',
      'first line: empty')
    t.equal(mockConsole.outLines[1], 'Command aliases: o, on',
      'second line: Command aliases ...')

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------
