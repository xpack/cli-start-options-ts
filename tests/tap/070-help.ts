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

const mockConsole = new MockConsole()
const log = new cli.Logger({ console: mockConsole, level: 'info' })

// ----------------------------------------------------------------------------

const lotsOfOptions: cli.OptionsGroup[] = [
  {
    description: 'Common group',
    isCommon: true,
    optionsDefinitions: [
      {
        options: ['--opt-common'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
          description: 'Opt common'
        }
      }
    ]
  },
  {
    description: 'Group options',
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
]

// ----------------------------------------------------------------------------

await test('cli.Help constructor()', async (t) => {
  mockConsole.clear()

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
  // Local console since the logger changes the level.
  const mockConsole = new MockConsole()
  const log = new cli.Logger({ console: mockConsole, level: 'info' })

  const context = new cli.Context({ log })

  const help = new cli.Help({ context })

  await t.test('log info', async (t) => {
    mockConsole.clear()

    help.output('info')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'info', 'content: info')

    t.end()
  })

  await t.test('log silent', async (t) => {
    mockConsole.clear()

    log.level = 'silent'
    help.output('silent')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')
    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  const helpAlways = new cli.Help({
    context,
    isOutputAlways: true
  })

  await t.test('always, log info', async (t) => {
    mockConsole.clear()

    helpAlways.output('info')

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    t.equal(mockConsole.outLines.length, 1, 'one output line')
    t.equal(mockConsole.outLines[0], 'info', 'content: info')

    t.end()
  })

  await t.test('always, log silent', async (t) => {
    mockConsole.clear()

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

await test('cli.Help outputMultiPassLine()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log })
    const help = new cli.Help({ context })
    help.outputMultiPassLine(undefined as unknown as {
      line: string
      description?: string
      skipUpdateWidth?: boolean
    })
  }, assert.AssertionError, 'assert(params)')

  t.throws(() => {
    const context = new cli.Context({ log })
    const help = new cli.Help({ context })
    help.outputMultiPassLine({
      line: undefined as unknown as string
    })
  }, assert.AssertionError, 'assert(params.line)')

  t.throws(() => {
    const context = new cli.Context({ log })
    const help = new cli.Help({ context })
    help.twoPassAlign(() => {
      help.outputMultiPassLine({
        line: '123'
      })
    })
  }, assert.AssertionError, 'assert(params.description)')

  mockConsole.clear()

  const context = new cli.Context({ log })
  const help = new cli.Help({ context })

  t.equal(help.multiPass.width, 0, 'width 0')

  help.twoPassAlign(() => {
    help.outputMultiPassLine({
      line: '123',
      description: 'one two three'
    })
  })

  t.equal(help.multiPass.width, 3 + 1, 'width 3+1')

  dumpLines(mockConsole.errLines)
  dumpLines(mockConsole.outLines)

  t.end()
})

await test('cli.Help outputTitle()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputTitle()
  }, assert.AssertionError, 'outputTitle assert(context.commandNode)')

  await t.test('my title', async (t) => {
    mockConsole.clear()

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

  await t.test('empty title', async (t) => {
    mockConsole.clear()

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
  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputCommandLine()
  }, assert.AssertionError, 'outputCommandLine assert(context.commandNode)')

  await t.test('empty', async (t) => {
    mockConsole.clear()

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
    mockConsole.clear()

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

  await t.test('pre/post options', async (t) => {
    mockConsole.clear()

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

  await t.test('options', async (t) => {
    mockConsole.clear()

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

  await t.test('lot of options', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    const commandsTree = new cli.CommandsTree({ context })
    context.commandNode = commandsTree
    commandsTree.helpDefinitions = {
      description: 'My Title',
      usagePreOptions: 'pre',
      usagePostOptions: 'post'
    }
    const options = new cli.Options({ context })
    options.addGroups(lotsOfOptions)
    context.options = options

    const help = new cli.Help({ context })

    help.outputCommandLine()

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      'Usage: xyz pre [options...] [--out <file>] [--opt] [--opt-str <s>]', //  0
      '           [--opt-str-multiple <s>]* [--opt-multiple]* [--opt-str-default <s>]', //  1
      '           [--opt-str-default-multi <s>]* --opt-str-mandatory <s>', //  2
      '           [--opt-str-multiple-mandatory <s>]+ --opt-str-default-mandatory <s>', //  3
      '           [--opt-str-default-multi-mandatory <s>]+ [--opt-values <s>]', //  4
      '           [--opt-values-multi <s>]* [--opt-values-default <s>]', //  5
      '           [--opt-values-default-multi <s>]* --opt-values-mandatory <s>', //  6
      '           [--opt-values-multi-mandatory <s>]+', //  7
      '           --opt-values-default-mandatory <s>', //  8
      '           [--opt-values-default-multi-mandatory <s>]+', //  9
      '           [--opt-str-very-very-very-very-very-long <s>] [--opt-no-desc <s>]', // 10
      '           [--no-description] [--no-help] post' // 11
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
  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputAvailableCommands()
  }, assert.AssertionError, 'assert(context.commandNode)')

  t.throws(() => {
    const context = new cli.Context({ log })

    const commandsTree = new cli.CommandsTree({ context })
    // Root tree node, practically empty.
    context.commandNode = commandsTree

    const help = new cli.Help({ context })
    help.outputAvailableCommands()
  }, assert.AssertionError, 'assert(commands.length > 0)')

  await t.test('top commands', async (t) => {
    mockConsole.clear()

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

  await t.test('sub-commands', async (t) => {
    mockConsole.clear()

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

  await t.test('post options', async (t) => {
    mockConsole.clear()

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

// ----------------------------------------------------------------------------

await test('cli.Help outputCommandAliases()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputCommandAliases()
  }, assert.AssertionError, 'assert(context.commandNode)')

  await t.test('no aliases', async (t) => {
    mockConsole.clear()

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
    mockConsole.clear()

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

// ----------------------------------------------------------------------------

await test('cli.Help outputAlignedOptionsGroups()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.options = undefined as unknown as cli.Options

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedOptionsGroups()
    })
  }, assert.AssertionError, 'assert(context.options)')

  await t.test('none', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedOptionsGroups()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')
    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  await t.test('non-relevant', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt-common-nodes'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
            }
          },
          {
            options: ['--help-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help common',
              isHelp: true
            }
          },
          {
            options: ['--early-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt early common',
              isRequiredEarly: true
            }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['--opt-nodesc'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
            }
          },
          {
            options: ['-h|--help'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help',
              isHelp: true
            }
          },
          {
            options: ['-E', '--opt-early'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt early',
              isRequiredEarly: true
            }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedOptionsGroups()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')
    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  await t.test('group descriptions', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt common'
            }
          }
        ]
      },
      {
        description: '',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt-common-nodesc'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt common'
            }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          }
        ]
      },
      {
        description: '',
        optionsDefinitions: [
          {
            options: ['--opt-nodesc'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedOptionsGroups()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      'Group:', // 1
      '  --opt                Option (optional)', // 2
      '  --opt-nodesc         Option (optional)', // 3
      '', // 4
      'Common Group:', // 5
      '  --opt-common         Opt common (optional)', // 6
      '  --opt-common-nodesc  Opt common (optional)' // 7
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  await t.test('formatting', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })

    context.options.addGroups(lotsOfOptions)
    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedOptionsGroups()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    /* eslint-disable max-len */
    const expectedLines = [
      '', //  0
      'Group options:', //  1
      '  -o|--out <file>                        Opt file (optional)', //  2
      '  --opt                                  Opt (optional)', //  3
      '  --opt-str <s>                          Opt string (optional)', //  4
      '  --opt-str-multiple <s>                 Opt string multiple (optional, multiple)', //  5
      '  --opt-multiple                         Opt string multiple (optional, multiple)', //  6
      '  --opt-str-default <s>                  Opt string with default (optional, default ddd)', //  7
      '  --opt-str-default-multi <s>            Opt string with default multi (optional, multiple, default ddd)', //  8
      '  --opt-str-mandatory <s>                Opt string mandatory', //  9
      '  --opt-str-multiple-mandatory <s>       Opt string multiple mandatory (multiple)', // 10
      '  --opt-str-default-mandatory <s>        Opt string with default mandatory', // 11
      '  --opt-str-default-multi-mandatory <s>  Opt string with default multi mandatory (multiple)', // 12
      '  --opt-values <s>                       Opt values (one|two) (optional)', // 13
      '  --opt-values-multi <s>                 Opt values multiple (one|two) (optional, multiple)', // 14
      '  --opt-values-default <s>               Opt values with default (one|two) (optional, default one)', // 15
      '  --opt-values-default-multi <s>         Opt values with default multi (one|two) (optional, multiple, default one)', // 16
      '  --opt-values-mandatory <s>             Opt values mandatory (one|two)', // 17
      '  --opt-values-multi-mandatory <s>       Opt values multiple mandatory (one|two) (multiple)', // 18
      '  --opt-values-default-mandatory <s>     Opt values with default mandatory (one|two)', // 19
      '  --opt-values-default-multi-mandatory <s>', // 20
      '                                         Opt values with default multi mandatory (one|two) (multiple)', // 21
      '  --opt-str-very-very-very-very-very-long <s>', // 22
      '                                         Opt string long (optional)', // 23
      '', // 24
      'Common group:', // 25
      '  --opt-common                           Opt common (optional)' // 26
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

await test('cli.Help outputAlignedAllHelpDetails()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.options.addGroups([
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: [],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt help',
              isHelp: true
            }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedAllHelpDetails()
    })
  }, assert.AssertionError, 'assert(optionDefinition.options.length > 0)')

  await t.test('none', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    const commandsTree = new cli.CommandsTree({ context })
    context.commandNode = commandsTree

    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option common'
            }
          },
          {
            options: ['--opt-common-no-help'],
            init: () => { },
            action: () => { }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['--opt-no-help'],
            init: () => { },
            action: () => { }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedAllHelpDetails()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')
    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  await t.test('regular single', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    const commandsTree = new cli.CommandsTree({ context })
    context.commandNode = commandsTree

    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['--help-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help common',
              isHelp: true
            }
          },
          {
            options: ['--opt-common-no-help'],
            init: () => { },
            action: () => { }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['-h1|--help1'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help 1',
              isHelp: true
            }
          },
          {
            options: ['-h2|--help2'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help 2',
              isHelp: true
            }
          },
          {
            options: ['-x', '--opt-help-nodesc'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              isHelp: true
            }
          },
          {
            options: ['--opt-no-help'],
            init: () => { },
            action: () => { }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedAllHelpDetails()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      'xyz -h1|--help1    Request help 1', // 1
      'xyz -h2|--help2    Request help 2', // 2
      'xyz --help-common  Request help common' // 3
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  await t.test('regular with subcommands', async (t) => {
    mockConsole.clear()

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

    context.commandNode = commandsTree

    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['--help-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help common',
              isHelp: true
            }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['-h1|--help1'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help 1',
              isHelp: true
            }
          },
          {
            options: ['-h2|--help2'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help 2',
              isHelp: true
            }
          },
          {
            options: ['-x', '--opt-help-nodesc'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              isHelp: true
            }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedAllHelpDetails()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      'xyz -h1|--help1              Request help 1', // 1
      'xyz -h2|--help2              Request help 2', // 2
      'xyz --help-common            Request help common', // 3
      'xyz <command> -h1|--help1    Request help 1 for command', // 4
      'xyz <command> -h2|--help2    Request help 2 for command', // 5
      'xyz <command> --help-common  Request help common for command' // 6
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  await t.test('large single', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    const commandsTree = new cli.CommandsTree({ context })
    context.commandNode = commandsTree

    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['--help-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help common',
              isHelp: true
            }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['-h1|--help1'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help 1',
              isHelp: true
            }
          },
          {
            options: ['-h2|--help2-very-very-very-very-very-very-long'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help 2',
              isHelp: true
            }
          },
          {
            options: ['-x', '--opt-help-nodesc'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              isHelp: true
            }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedAllHelpDetails()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      'xyz -h1|--help1                          Request help 1', // 1
      'xyz -h2|--help2-very-very-very-very-very-very-long', // 2
      '                                         Request help 2', // 3
      'xyz --help-common                        Request help common' // 4
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  await t.test('extra large single', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    const commandsTree = new cli.CommandsTree({ context })
    context.commandNode = commandsTree

    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['--help-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help common',
              isHelp: true
            }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['-h1|--help1'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help 1',
              isHelp: true
            }
          },
          {
            options: ['-h2|--help2-very-very-very-very-very-very-long'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Request help 2',
              isHelp: true,
              isExtraLarge: true
            }
          },
          {
            options: ['-x', '--opt-help-nodesc'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              isHelp: true
            }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedAllHelpDetails()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      '', // 0
      'xyz -h1|--help1    Request help 1', // 1
      'xyz -h2|--help2-very-very-very-very-very-very-long', // 2
      '                   Request help 2', // 3
      'xyz --help-common  Request help common' // 4
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

await test('cli.Help outputAlignedEarlyDetails()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.options.addGroups([
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: [],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt early',
              isRequiredEarly: true
            }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedEarlyDetails()
    })
  }, assert.AssertionError, 'assert(optionDefinition.options.length > 0)')

  await t.test('none', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option common'
            }
          },
          {
            options: ['--opt-common-no-help'],
            init: () => { },
            action: () => { }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['--opt-no-help'],
            init: () => { },
            action: () => { }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedEarlyDetails()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')
    t.equal(mockConsole.outLines.length, 0, 'no output lines')

    t.end()
  })

  await t.test('regular', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['--early-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt early common',
              isRequiredEarly: true
            }
          },
          {
            options: ['--opt-common-no-help'],
            init: () => { },
            action: () => { }
          }]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['-E', '--opt-early'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt early',
              isRequiredEarly: true
            }
          },
          {
            options: ['-x', '--opt-early-nodesc'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              isRequiredEarly: true
            }
          },
          {
            options: ['--opt-no-help'],
            init: () => { },
            action: () => { }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedEarlyDetails()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      'xyz -E|--opt-early  Opt early', // 0
      'xyz --early-common  Opt early common' // 1
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  await t.test('large', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['--early-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt early common',
              isRequiredEarly: true
            }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['-E', '--opt-early'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt early',
              isRequiredEarly: true
            }
          },
          {
            options: ['--opt-str-very-very-very-very-very-long'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            helpDefinitions: {
              description: 'Opt string long',
              isRequiredEarly: true
            }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedEarlyDetails()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      'xyz -E|--opt-early                       Opt early', // 0
      'xyz --opt-str-very-very-very-very-very-long', // 1
      '                                         Opt string long', // 2
      'xyz --early-common                       Opt early common' // 3
    ]

    t.equal(mockConsole.outLines.length, expectedLines.length,
      'output lines count')
    // Compare content, not object.
    t.same(mockConsole.outLines, expectedLines, 'output lines')

    t.end()
  })

  await t.test('extra large', async (t) => {
    mockConsole.clear()

    const context = new cli.Context({ log, programName: 'xyz' })
    context.options.addGroups([
      {
        description: 'Common Group',
        isCommon: true,
        optionsDefinitions: [
          {
            options: ['--opt'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Option'
            }
          },
          {
            options: ['--early-common'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt early common',
              isRequiredEarly: true
            }
          }
        ]
      },
      {
        description: 'Group',
        optionsDefinitions: [
          {
            options: ['-E', '--opt-early'],
            init: () => { },
            action: () => { },
            helpDefinitions: {
              description: 'Opt early',
              isRequiredEarly: true
            }
          },
          {
            options: ['--opt-str-very-very-very-very-very-long'],
            init: (_context) => { },
            action: (_context, _val) => { },
            hasValue: true,
            helpDefinitions: {
              description: 'Opt string long',
              isRequiredEarly: true,
              isExtraLarge: true
            }
          }
        ]
      }
    ])

    const help = new cli.Help({ context })

    help.twoPassAlign(() => {
      help.outputAlignedEarlyDetails()
    })

    // dumpLines(mockConsole.errLines)
    // dumpLines(mockConsole.outLines)

    t.equal(mockConsole.errLines.length, 0, 'no error lines')

    const expectedLines = [
      'xyz -E|--opt-early  Opt early', // 0
      'xyz --opt-str-very-very-very-very-very-long', // 1
      '                    Opt string long', // 2
      'xyz --early-common  Opt early common' // 3
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

await test('cli.Help outputFooter()', async (t) => {
  mockConsole.clear()

  t.throws(() => {
    const context = new cli.Context({ log })

    const help = new cli.Help({ context })
    help.outputFooter()
  }, assert.AssertionError, 'assert(context.rootPath)')

  await t.test('npm details', async (t) => {
    mockConsole.clear()

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

  await t.test('home page', async (t) => {
    mockConsole.clear()

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

  await t.test('bug url', async (t) => {
    mockConsole.clear()

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

  await t.test('bug author name & email', async (t) => {
    mockConsole.clear()

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

  await t.test('bug author email', async (t) => {
    mockConsole.clear()

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

  await t.test('bug author string', async (t) => {
    mockConsole.clear()

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
