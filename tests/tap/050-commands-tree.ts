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

/*
 * Test the tree used for storing and processing commands.
 */

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

await test('CharacterNode', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })

  // Constructor
  const tree = new cli.CharactersTree(commandsTree)

  t.equal(tree.name, '^', 'tree node name ^')
  t.equal(tree.children.size, 0, 'tree has no children')
  t.equal(tree.parent, undefined, 'tree has no parent')
  t.equal(tree.commandNode, undefined, 'tree no commandNode')
  t.equal(tree.parentCommandNode, commandsTree, 'tree has parentCommandNode')

  t.notOk(tree.hasCommandNode(), 'tree.hasCommandNode() false')

  let node: cli.CharacterNode
  t.throws(() => {
    node = new cli.CharacterNode('xx')
  }, assert.AssertionError, 'assert(char.length === 1)')

  // addChildNode()
  t.throws(() => {
    node = tree.addChildNode(undefined as unknown as string)
  }, assert.AssertionError, 'assert(char !== undefined)')

  t.throws(() => {
    node = tree.addChildNode('xx')
  }, assert.AssertionError, 'assert(char.length === 1)')

  node = tree.addChildNode('x')
  t.equal(node.name, 'x', 'node name x')

  t.equal(node.children.size, 0, 'node has no children')
  t.equal(node.parent, tree, 'node has parent')
  t.equal(node.commandNode, undefined, 'tree no commandNode')

  t.equal(tree.children.size, 1, 'tree has a child')

  const node2 = tree.addChildNode('x')
  t.equal(node2, node, 'same node x')

  t.end()
})

await test('CharacterNode addCommand', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })

  const commandsTree = new cli.CommandsTree({ context })
  const copyCommandNode = commandsTree.addCommandNode({
    name: 'copy',
    moduleRelativePath: '.',
    context
  })
  const confCommandNode = commandsTree.addCommandNode({
    name: 'conf',
    moduleRelativePath: '.',
    context
  })

  const charactersTree = new cli.CharactersTree(commandsTree)

  t.throws(() => {
    charactersTree.addCommand(undefined as unknown as { name: string
      commandNode: cli.CommandNode })
  }, assert.AssertionError, 'assert(params)')

  t.throws(() => {
    const charactersTree2 = new cli.CharactersTree(commandsTree)
    charactersTree2.commandNode = commandsTree
    charactersTree2.addCommand({
      name: 'copy',
      commandNode: copyCommandNode
    })
  }, assert.AssertionError, 'assert(!this.hasCommandNode())')

  t.throws(() => {
    charactersTree.addCommand({
      name: 'co py',
      commandNode: copyCommandNode
    })
  }, assert.AssertionError, 'assert(!lowerCaseName.includes(\' \')')

  t.throws(() => {
    charactersTree.addCommand({
      name: 'copy',
      commandNode: undefined as unknown as cli.CommandNode
    })
  }, assert.AssertionError, 'assert(params.commandNode)')

  t.throws(() => {
    charactersTree.addCommand({
      name: 'copy',
      commandNode: commandsTree
    })
  }, assert.AssertionError, 'assert(params.commandNode.parent)')

  const copyCharacterNode = charactersTree.addCommand({
    name: 'copy',
    commandNode: copyCommandNode
  })
  t.equal(copyCharacterNode.name, '.', 'has terminator')
  t.equal(copyCharacterNode.parent?.name, 'y', 'has y')
  t.equal(copyCharacterNode.parent?.parent?.name, 'p', 'has p')
  t.equal(copyCharacterNode.parent?.parent?.parent?.name, 'o', 'has o')
  t.equal(copyCharacterNode.parent?.parent?.parent?.parent?.name, 'c', 'has c')
  t.equal(copyCharacterNode.parent?.parent?.parent?.parent?.parent?.name,
    '^', 'has ^')
  t.ok(copyCharacterNode.hasCommandNode(), 'copy . hasCommandNode()')
  t.notOk(copyCharacterNode.parent?.hasCommandNode(),
    'copy y !hasCommandNode()')

  t.throws(() => {
    charactersTree.addCommand({
      name: 'copy',
      commandNode: copyCommandNode
    })
  }, assert.AssertionError, 'assert(!characterNode.hasCommandNode())')

  const confCharacterNode = charactersTree.addCommand({
    name: 'conf',
    commandNode: confCommandNode
  })
  t.equal(confCharacterNode.name, '.', 'conf has terminator')

  t.end()
})

await test('CharactersTree findCommandNode', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })

  const commandsTree = new cli.CommandsTree({ context })
  const copyCommandNode = commandsTree.addCommandNode({
    name: 'copy',
    moduleRelativePath: '.',
    context
  })
  const copaCommandNode = commandsTree.addCommandNode({
    name: 'copa',
    moduleRelativePath: '.',
    context
  })
  const confCommandNode = commandsTree.addCommandNode({
    name: 'config',
    aliases: ['conf', 'cong', 'co'],
    moduleRelativePath: '.',
    context
  })

  commandsTree.validateCommands()

  const charactersTree = commandsTree.charactersTree

  t.equal(charactersTree.findCommandNode('config'), confCommandNode,
    'finds config')
  t.equal(charactersTree.findCommandNode('confi'), confCommandNode,
    'finds confi')
  t.equal(charactersTree.findCommandNode('conf'), confCommandNode, 'finds conf')
  t.equal(charactersTree.findCommandNode('cong'), confCommandNode, 'finds cong')
  t.equal(charactersTree.findCommandNode('con'), confCommandNode, 'finds con')
  t.equal(charactersTree.findCommandNode('co'), confCommandNode, 'finds co')

  t.equal(charactersTree.findCommandNode('copy'), copyCommandNode, 'finds copy')
  t.equal(charactersTree.findCommandNode('copa'), copaCommandNode, 'finds copa')

  try {
    charactersTree.findCommandNode('c')
    t.fail('c did not throw')
  } catch (err: any) {
    t.match(err.message, 'not unique', 'c throws not unique')
  }

  try {
    charactersTree.findCommandNode('cop')
    t.fail('cop did not throw')
  } catch (err: any) {
    t.match(err.message, 'not unique', 'cop throws not unique')
  }

  try {
    charactersTree.findCommandNode('copyy')
    t.fail('copyy did not throw')
  } catch (err: any) {
    t.match(err.message, 'probably misspelled', 'copyy misspelled')
  }

  try {
    charactersTree.findCommandNode('conff')
    t.fail('conff did not throw')
  } catch (err: any) {
    t.match(err.message, 'probably misspelled', 'conff misspelled')
  }

  try {
    charactersTree.findCommandNode('ca')
    t.fail('ca did not throw')
  } catch (err: any) {
    t.match(err.message, 'not supported', 'ca throws not supported')
  }

  try {
    charactersTree.findCommandNode('copb')
    t.fail('copb did not throw')
  } catch (err: any) {
    t.match(err.message, 'not supported', 'copb throws not supported')
  }

  t.end()
})

await test('CommandsTree', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })

  t.equal(commandsTree.context, context, 'tree context')
  t.equal(commandsTree.name, '(tree)', 'tree name')
  t.equal(commandsTree.aliases.length, 0, 'tree empty aliases')
  t.equal(commandsTree.moduleRelativePath, undefined,
    'tree no moduleRelativePath')
  t.equal(commandsTree.className, undefined, 'tree className undefined')

  t.equal(commandsTree.helpOptions, undefined, 'tree helpOptions undefined')

  t.notOk(commandsTree.hasForwardableArguments,
    'tree hasForwardableArguments false')
  t.notOk(commandsTree.hasCustomOptions,
    'tree hasCustomOptions false')
  t.notOk(commandsTree.hasCustomArgs,
    'tree hasCustomArgs false')

  t.equal(commandsTree.parent, undefined, 'tree parent undefined')

  t.equal(commandsTree.children.size, 0, 'tree children empty')

  t.equal(commandsTree.charactersTree.children.size, 0,
    'tree charactersTree empty')

  t.equal(commandsTree.terminatorCharacterNodes.length, 0,
    'tree.terminatorCharacterNodes empty')

  t.equal(commandsTree.remainingCommands.length, 0,
    'tree.remainingCommands empty')

  t.equal(commandsTree.getModulePath(), undefined, 'no getModulePath()')

  // --------------------------------------------------------------------------
  const helpTitle = 'my title'
  commandsTree.setHelpTitle(helpTitle)
  t.equal(commandsTree.helpOptions?.title, helpTitle,
    'tree helpOptions title set')

  const helpTitle2 = 'my other title'
  commandsTree.setHelpTitle(helpTitle2)
  t.equal(commandsTree.helpOptions?.title, helpTitle2,
    'tree helpOptions other title set')

  // --------------------------------------------------------------------------
  t.equal(commandsTree.getUnaliasedCommandParts.length, 0,
    'tree getUnaliasedCommandParts() empty')

  t.end()
})

await test('CommandsTree findCommandNode', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })

  t.equal(commandsTree.depth, 1, 'tree depth 1')

  commandsTree.addCommands({
    copy: {
      moduleRelativePath: 'copy.js',
      className: 'Copy',
      helpOptions: {
        title: 'The copy command'
      }
    },
    conf: {
      moduleRelativePath: 'conf.js'
    }
  })

  commandsTree.validateCommands()

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 2, 'tree has 2 commands')

  // Results keep the original order.
  t.equal(commands[0], 'copy', 'first is copy')
  t.equal(commands[1], 'conf', 'second is conf')

  const copyCommandNode = commandsTree.findCommandNode(['copy'])
  t.equal(copyCommandNode.moduleRelativePath, 'copy.js',
    '"copy" moduleRelativePath is copy.js')
  t.equal(copyCommandNode.className, 'Copy', 'copy class is Copy')

  t.equal(copyCommandNode.depth, 2, 'copy depth 2')

  // Test findCommandModule().
  const foundCommandModule = commandsTree.findCommandModule(['copy'])
  t.equal(foundCommandModule.moduleRelativePath, 'copy.js',
    '"copy" moduleRelativePath is copy.js')
  t.equal(foundCommandModule.className, 'Copy', 'copy class is Copy')

  t.equal(copyCommandNode.getHelpTitle(), 'The copy command',
    'copy command title')

  const commandParts = copyCommandNode.getUnaliasedCommandParts()
  t.equal(commandParts.length, 1, 'unaliased array has one entry')
  t.equal(commandParts[0], 'copy', 'first command is copy')

  const helpTitle = 'my title'
  commandsTree.setHelpTitle(helpTitle)
  t.equal(commandsTree.helpOptions?.title, helpTitle,
    'tree helpOptions title set')

  const confCommandNode = commandsTree.findCommandNode(['conf'])
  t.equal(confCommandNode.moduleRelativePath, 'conf.js',
    '"conf" moduleRelativePath is conf.js')

  t.equal(confCommandNode.getHelpTitle(), helpTitle,
    'conf command title')

  t.end()
})

await test('subcommands', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })
  commandsTree.addCommands({
    copy: {
      moduleRelativePath: 'copy.js',
      subCommands: {
        binary: {
          moduleRelativePath: 'copyBin.js'
        },
        ascii: {
          moduleRelativePath: 'copyAsc.js'
        },
        other: {
          moduleRelativePath: 'copyOther.js',
          subCommands: {
            one: {
              className: 'CopyOtherOne'
            },
            two: {
              className: 'CopyOtherTwo'
            }
          }
        }
      }
    },
    conf: {
      moduleRelativePath: 'conf.js'
    }
  })

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 2, 'has 2 commands')

  // Results respect the original order.
  t.equal(commands[0], 'copy', 'first is copy')
  t.equal(commands[1], 'conf', 'second is conf')

  commandsTree.validateCommands()
  t.equal(commandsTree.terminatorCharacterNodes.length, 2, 'has 2 end nodes')

  let commandNode
  let commandParts
  commandNode = commandsTree.findCommandNode(['copy'])
  t.equal(commandNode.moduleRelativePath, 'copy.js',
    '"copy" moduleRelativePath is copy.js')

  commandParts = commandNode.getUnaliasedCommandParts()
  t.equal(commandParts.length, 1, 'unaliased array has one entry')
  t.equal(commandParts[0], 'copy', 'first command is copy')

  commandNode = commandsTree.findCommandNode(['copy', 'binary'])
  t.equal(commandNode.moduleRelativePath, 'copyBin.js',
    '"copy binary" moduleRelativePath is copyBin.js')

  t.equal(commandNode.depth, 3, 'copy binary depth 3')

  commandParts = commandNode.getUnaliasedCommandParts()
  t.equal(commandParts.length, 2, 'unaliased array has 2 entries')
  t.equal(commandParts[0], 'copy', 'first command is copy')
  t.equal(commandParts[1], 'binary', 'second command is binary')

  commandNode = commandsTree.findCommandNode(['copy', 'ascii'])
  t.equal(commandNode.moduleRelativePath, 'copyAsc.js',
    '"copy ascii" moduleRelativePath is copyAsc.js')

  commandParts = commandNode.getUnaliasedCommandParts()
  t.equal(commandParts.length, 2, 'unaliased array has 2 entries')
  t.equal(commandParts[0], 'copy', 'first command is copy')
  t.equal(commandParts[1], 'ascii', 'second command is ascii')

  commandNode = commandsTree.findCommandNode(['copy', 'other', 'one'])
  t.equal(commandNode.getModulePath(), 'copyOther.js',
    '"copy other one" moduleRelativePath is copyOther.js')
  t.equal(commandNode.depth, 4, 'copy binary depth 4')

  commandNode = commandsTree.findCommandNode(['conf'])
  t.equal(commandNode.moduleRelativePath, 'conf.js',
    '"conf" moduleRelativePath is conf.js')

  commandParts = commandNode.getUnaliasedCommandParts()
  t.equal(commandParts.length, 1, 'unaliased array has one entry')
  t.equal(commandParts[0], 'conf', 'first command is conf')

  t.end()
})

// -----------------------------------------------------------------------------
// Additional tests.

await test('two commands', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })
  commandsTree.addCommands({
    copy: {
      moduleRelativePath: 'copy.js',
      className: 'Copy'
    },
    conf: {
      moduleRelativePath: 'conf.js'
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
  t.equal(commandNode.moduleRelativePath, 'copy.js', 'copy module is copy.js')
  t.equal(commandNode.className, 'Copy', 'copy class is Copy')

  // Test findCommandModule().
  const foundCommandModule = commandsTree.findCommandModule(['copy'])
  t.equal(foundCommandModule.moduleRelativePath, 'copy.js',
    'copy module is copy.js')
  t.equal(foundCommandModule.className, 'Copy', 'copy class is Copy')

  arr = commandNode.getUnaliasedCommandParts()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'copy', 'first command is copy')

  commandNode = commandsTree.findCommandNode(['conf'])
  t.equal(commandNode.moduleRelativePath, 'conf.js', 'conf module is conf.js')
  t.equal(commandNode.className, undefined, 'conf class is not defined')

  arr = commandNode.getUnaliasedCommandParts()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'conf', 'first command is conf')

  commandNode = commandsTree.findCommandNode(['cop'])
  t.equal(commandNode.moduleRelativePath, 'copy.js', 'cop module is copy.js')

  commandNode = commandsTree.findCommandNode(['con'])
  t.equal(commandNode.moduleRelativePath, 'conf.js', 'con module is conf.js')

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
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })
  commandsTree.addCommands({
    copy: {
      moduleRelativePath: 'copy.js'
    },
    conf: {
      moduleRelativePath: 'conf.js'
    }
  })

  const commands = commandsTree.getChildrenCommandNames()
  t.equal(commands.length, 2, 'has 2 commands')

  try {
    commandsTree.addCommands({
      copy: {
        moduleRelativePath: 'copy.js'
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
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })
  commandsTree.addCommands({
    build: {
      aliases: ['b', 'bild'],
      moduleRelativePath: 'build.js'
    },
    conf: {
      moduleRelativePath: 'conf.js'
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
  t.equal(commandNode.moduleRelativePath, 'build.js',
    'build module is build.js')

  const arr = commandNode.getUnaliasedCommandParts()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'build', 'first command is build')

  commandNode = commandsTree.findCommandNode(['bild'])
  t.equal(commandNode.moduleRelativePath, 'build.js', 'bild module is build.js')

  commandNode = commandsTree.findCommandNode(['b'])
  t.equal(commandNode.moduleRelativePath, 'build.js', 'b module is build.js')

  commandNode = commandsTree.findCommandNode(['bi'])
  t.equal(commandNode.moduleRelativePath, 'build.js', 'bi module is build.js')

  try {
    commandNode = commandsTree.findCommandNode(['bildu'])
    t.fail('bildu did not throw')
  } catch (err: any) {
    t.match(err.message, 'probably misspelled', 'bildu misspelled')
  }

  commandNode = commandsTree.findCommandNode(['conf'])
  t.equal(commandNode.moduleRelativePath, 'conf.js', 'conf module is conf.js')

  t.end()
})

await test('mixed aliases', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })
  commandsTree.addCommands({
    build: {
      aliases: ['c', 'cild'],
      moduleRelativePath: 'build.js'
    },
    conf: {
      moduleRelativePath: 'conf.js'
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
  t.equal(commandNode.moduleRelativePath, 'build.js',
    'build module is build.js')

  const arr = commandNode.getUnaliasedCommandParts()
  t.equal(arr.length, 1, 'unaliased array has one entry')
  t.equal(arr[0], 'build', 'first command is build')

  commandNode = commandsTree.findCommandNode(['cild'])
  t.equal(commandNode.moduleRelativePath, 'build.js', 'cild module is build.js')

  commandNode = commandsTree.findCommandNode(['ci'])
  t.equal(commandNode.moduleRelativePath, 'build.js', 'ci module is build.js')

  commandNode = commandsTree.findCommandNode(['c'])
  t.equal(commandNode.moduleRelativePath, 'build.js', 'c module is build.js')

  try {
    commandNode = commandsTree.findCommandNode(['cildu'])
    t.fail('cildu did not throw')
  } catch (err: any) {
    t.match(err.message, 'probably misspelled', 'bildu misspelled')
  }

  commandNode = commandsTree.findCommandNode(['conf'])
  t.equal(commandNode.moduleRelativePath, 'conf.js', 'conf module is conf.js')

  commandNode = commandsTree.findCommandNode(['co'])
  t.equal(commandNode.moduleRelativePath, 'conf.js', 'co module is conf.js')

  t.end()
})

await test('promotion', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })
  commandsTree.addCommands({
    copy: {
      aliases: ['cpy'],
      moduleRelativePath: 'copy.js',
      subCommands: {
        binary: {
          aliases: ['by'],
          moduleRelativePath: 'copyBin.js'
        },
        ascii: {
          aliases: ['ai'],
          moduleRelativePath: 'copyAsc.js'
        },
        utf: {
          aliases: ['alt'],
          moduleRelativePath: 'copyAlt.js'
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
  t.equal(commandNode.moduleRelativePath, 'copy.js', 'c module is copy.js')

  commandNode = commandsTree.findCommandNode(['c', 'b'])
  t.equal(commandNode.moduleRelativePath, 'copyBin.js',
    'c b module is copyBin.js')

  try {
    commandNode = commandsTree.findCommandNode(['c', 'a'])
    t.fail('c a did not throw')
  } catch (err: any) {
    t.match(err.message, 'is not unique', 'c a not unique')
  }

  t.end()
})

await test('subcommands without parent command class', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })
  const commandsTree = new cli.CommandsTree({ context })
  commandsTree.addCommands({
    copy: {
      subCommands: {
        binary: {
          moduleRelativePath: 'copyBin.js'
        },
        ascii: {
          moduleRelativePath: 'copyAsc.js'
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
  t.notOk(commandNode.moduleRelativePath, 'copy has no moduleRelativePath')

  commandNode = commandsTree.findCommandNode(['copy', 'binary'])
  t.equal(commandNode.moduleRelativePath, 'copyBin.js',
    'copy binary module is copyBin.js')

  t.end()
})

await test('subcommands without module', async (t) => {
  try {
    const log = new cli.Logger()
    const context = new cli.Context({ log })
    const commandsTree = new cli.CommandsTree({ context })
    commandsTree.addCommands({
      copy: {
        subCommands: {
          binary: {
            moduleRelativePath: 'copyBin.js'
          },
          ascii: {
          }
        }
      }
    })
    t.fail('buildCharactersTree did not throw')
  } catch (err: any) {
    t.match(err.message, 'must have a moduleRelativePath',
      'must have moduleRelativePath')
  }

  t.end()
})

// ----------------------------------------------------------------------------
