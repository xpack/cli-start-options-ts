/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/license/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/**
 * Test the tree used for storing and processing commands.
 */

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

await test('two commands', async (t) => {
  const commandsTree = new cli.CommandsTree2()
  commandsTree.addCommands({
    copy: {
      modulePath: 'copy.js',
      className: 'Copy'
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  t.ok(commandsTree.hasChildrenCommands(), 'tree has commands')

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 2, 'tree has 2 commands')

  // Results are sorted.
  t.equal(commands[0], 'copy', 'first is copy')
  t.equal(commands[1], 'conf', 'second is conf')

  commandsTree.validateCommands()
  t.equal(commandsTree.terminatorCharacterNodes.length, 2, 'has 2 end nodes')

  let commandNode
  let arr
  commandNode = commandsTree.findCommandNode(['copy'])
  t.equal(commandNode.modulePath, 'copy.js', 'copy module is copy.js')
  t.equal(commandNode.className, 'Copy', 'copy class is Copy')

  arr = commandNode.getUnaliasedSubCommands()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'copy', 'first command is copy')

  commandNode = commandsTree.findCommandNode(['conf'])
  t.equal(commandNode.modulePath, 'conf.js', 'conf module is conf.js')
  t.equal(commandNode.className, undefined, 'conf class is not defined')

  arr = commandNode.getUnaliasedSubCommands()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'conf', 'first command is conf')

  commandNode = commandsTree.findCommandNode(['cop'])
  t.equal(commandNode.modulePath, 'copy.js', 'cop module is copy.js')

  commandNode = commandsTree.findCommandNode(['con'])
  t.equal(commandNode.modulePath, 'conf.js', 'con module is conf.js')

  try {
    commandNode = commandsTree.findCommandNode(['copyy'])
    t.fail('copyy did not throw')
  } catch (err: any) {
    t.match(err.message, 'probably misspelled', 'copyy misspelled')
  }

  try {
    commandNode = commandsTree.findCommandNode(['conff'])
    t.fail('conff did not throw')
  } catch (err: any) {
    t.match(err.message, 'probably misspelled', 'conff misspelled')
  }

  try {
    commandNode = commandsTree.findCommandNode(['co'])
    t.fail('co did not throw')
  } catch (err: any) {
    t.match(err.message, 'not unique', 'co throws not unique')
  }

  try {
    commandNode = commandsTree.findCommandNode(['ca'])
    t.fail('ca did not throw')
  } catch (err: any) {
    t.match(err.message, 'not supported', 'ca throws not supported')
  }

  t.end()
})

await test('duplicate commands', async (t) => {
  const commandsTree = new cli.CommandsTree2()
  commandsTree.addCommands({
    copy: {
      modulePath: 'copy.js'
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 2, 'has 2 commands')

  try {
    commandsTree.addCommands({
      copy: {
        modulePath: 'copy.js'
      }
    })
    t.fail('duplicate copy did not throw')
  } catch (err: any) {
    if (err instanceof assert.AssertionError) {
      t.match(err.message, 'Duplicate command', 'throws duplicate')
    }
  }

  t.end()
})

await test('aliases', async (t) => {
  const commandsTree = new cli.CommandsTree2()
  commandsTree.addCommands({
    build: {
      aliases: ['b', 'bild'],
      modulePath: 'build.js'
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 2, 'has 2 commands')

  // Results are sorted.
  t.equal(commands[0], 'build', 'first is build')
  t.equal(commands[1], 'conf', 'second is conf')

  commandsTree.validateCommands()
  t.equal(commandsTree.terminatorCharacterNodes.length, 4, 'has 4 end nodes')

  let commandNode
  commandNode = commandsTree.findCommandNode(['build'])
  t.equal(commandNode.modulePath, 'build.js', 'build module is build.js')

  const arr = commandNode.getUnaliasedSubCommands()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'build', 'first command is build')

  commandNode = commandsTree.findCommandNode(['bild'])
  t.equal(commandNode.modulePath, 'build.js', 'bild module is build.js')

  commandNode = commandsTree.findCommandNode(['b'])
  t.equal(commandNode.modulePath, 'build.js', 'b module is build.js')

  commandNode = commandsTree.findCommandNode(['bi'])
  t.equal(commandNode.modulePath, 'build.js', 'bi module is build.js')

  try {
    commandNode = commandsTree.findCommandNode(['bildu'])
    t.fail('bildu did not throw')
  } catch (err: any) {
    t.match(err.message, 'probably misspelled', 'bildu misspelled')
  }

  commandNode = commandsTree.findCommandNode(['conf'])
  t.equal(commandNode.modulePath, 'conf.js', 'conf module is conf.js')

  t.end()
})

await test('mixed aliases', async (t) => {
  const commandsTree = new cli.CommandsTree2()
  commandsTree.addCommands({
    build: {
      aliases: ['c', 'cild'],
      modulePath: 'build.js'
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 2, 'has 2 commands')

  // Results are sorted.
  t.equal(commands[0], 'build', 'first is build')
  t.equal(commands[1], 'conf', 'second is conf')

  commandsTree.validateCommands()
  t.equal(commandsTree.terminatorCharacterNodes.length, 4, 'has 4 end nodes')

  let commandNode
  commandNode = commandsTree.findCommandNode(['build'])
  t.equal(commandNode.modulePath, 'build.js', 'build module is build.js')

  const arr = commandNode.getUnaliasedSubCommands()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'build', 'first command is build')

  commandNode = commandsTree.findCommandNode(['cild'])
  t.equal(commandNode.modulePath, 'build.js', 'cild module is build.js')

  commandNode = commandsTree.findCommandNode(['ci'])
  t.equal(commandNode.modulePath, 'build.js', 'ci module is build.js')

  commandNode = commandsTree.findCommandNode(['c'])
  t.equal(commandNode.modulePath, 'build.js', 'c module is build.js')

  try {
    commandNode = commandsTree.findCommandNode(['cildu'])
    t.fail('cildu did not throw')
  } catch (err: any) {
    t.match(err.message, 'probably misspelled', 'bildu misspelled')
  }

  commandNode = commandsTree.findCommandNode(['conf'])
  t.equal(commandNode.modulePath, 'conf.js', 'conf module is conf.js')

  commandNode = commandsTree.findCommandNode(['co'])
  t.equal(commandNode.modulePath, 'conf.js', 'co module is conf.js')

  t.end()
})

await test('two commands two subcommands', async (t) => {
  const commandsTree = new cli.CommandsTree2()
  commandsTree.addCommands({
    copy: {
      modulePath: 'copy.js',
      subCommands: {
        binary: {
          modulePath: 'copyBin.js'
        },
        ascii: {
          modulePath: 'copyAsc.js'
        }
      }
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 2, 'has 2 commands')

  // Results are sorted.
  t.equal(commands[0], 'copy', 'first is copy')
  t.equal(commands[1], 'conf', 'second is conf')

  commandsTree.validateCommands()
  t.equal(commandsTree.terminatorCharacterNodes.length, 2, 'has 2 end nodes')

  let commandNode
  let arr
  commandNode = commandsTree.findCommandNode(['copy'])
  t.equal(commandNode.modulePath, 'copy.js', 'copy module is copy.js')

  arr = commandNode.getUnaliasedSubCommands()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'copy', 'first command is copy')

  commandNode = commandsTree.findCommandNode(['copy', 'binary'])
  t.equal(commandNode.modulePath, 'copyBin.js',
    'copy binary module is copyBin.js')

  arr = commandNode.getUnaliasedSubCommands()
  t.equal(arr.length, 2, 'unaliased array has 2 entries')
  t.equal(arr[0], 'copy', 'first command is copy')
  t.equal(arr[1], 'binary', 'second command is binary')

  commandNode = commandsTree.findCommandNode(['copy', 'ascii'])
  t.equal(commandNode.modulePath, 'copyAsc.js',
    'copy ascii module is copyAsc.js')

  arr = commandNode.getUnaliasedSubCommands()
  t.equal(arr.length, 2, 'unaliased array has 2 entries')
  t.equal(arr[0], 'copy', 'first command is copy')
  t.equal(arr[1], 'ascii', 'second command is ascii')

  commandNode = commandsTree.findCommandNode(['conf'])
  t.equal(commandNode.modulePath, 'conf.js', 'conf module is conf.js')

  arr = commandNode.getUnaliasedSubCommands()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'conf', 'first command is conf')

  t.end()
})

await test('promotion', async (t) => {
  const commandsTree = new cli.CommandsTree2()
  commandsTree.addCommands({
    copy: {
      aliases: ['cpy'],
      modulePath: 'copy.js',
      subCommands: {
        binary: {
          aliases: ['by'],
          modulePath: 'copyBin.js'
        },
        ascii: {
          aliases: ['ai'],
          modulePath: 'copyAsc.js'
        },
        utf: {
          aliases: ['alt'],
          modulePath: 'copyAlt.js'
        }
      }
    }
  })

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 1, 'has 1 command')

  t.equal(commands[0], 'copy', 'first is copy')

  commandsTree.validateCommands()
  t.equal(commandsTree.terminatorCharacterNodes.length, 2, 'has 2 end nodes')

  let commandNode

  commandNode = commandsTree.findCommandNode(['c'])
  t.equal(commandNode.modulePath, 'copy.js', 'c module is copy.js')

  commandNode = commandsTree.findCommandNode(['c', 'b'])
  t.equal(commandNode.modulePath, 'copyBin.js', 'c b module is copyBin.js')

  try {
    commandNode = commandsTree.findCommandNode(['c', 'a'])
    t.fail('c a did not throw')
  } catch (err: any) {
    t.match(err.message, 'is not unique', 'c a not unique')
  }

  t.end()
})

await test('subcommands without parent command class', async (t) => {
  const commandsTree = new cli.CommandsTree2()
  commandsTree.addCommands({
    copy: {
      subCommands: {
        binary: {
          modulePath: 'copyBin.js'
        },
        ascii: {
          modulePath: 'copyAsc.js'
        }
      }
    }
  })

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 1, 'has 1 command')

  t.equal(commands[0], 'copy', 'first is copy')

  commandsTree.validateCommands()
  t.equal(commandsTree.terminatorCharacterNodes.length, 1, 'has 1 end node')

  let commandNode

  commandNode = commandsTree.findCommandNode(['copy'])
  t.notOk(commandNode.modulePath, 'copy has no modulePath')

  commandNode = commandsTree.findCommandNode(['copy', 'binary'])
  t.equal(commandNode.modulePath, 'copyBin.js',
    'copy binary module is copyBin.js')

  t.end()
})

await test('subcommands without module', async (t) => {
  try {
    const commandsTree = new cli.CommandsTree2()
    commandsTree.addCommands({
      copy: {
        subCommands: {
          binary: {
            modulePath: 'copyBin.js'
          },
          ascii: {
          }
        }
      }
    })
    t.fail('buildCharactersTree did not throw')
  } catch (err: any) {
    t.match(err.message, 'must have a modulePath', 'must have modulePath')
  }

  t.end()
})

// ----------------------------------------------------------------------------
