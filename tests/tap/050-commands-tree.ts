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
    charactersTree.addCommand(undefined as unknown as {
      name: string
      commandNode: cli.CommandNode
    })
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

  t.equal(commandsTree.helpDefinitions, undefined,
    'tree helpDefinitions undefined')

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
  const helpDescription = 'my title'
  commandsTree.setHelpDescription(helpDescription)
  t.equal(commandsTree.helpDefinitions?.description, helpDescription,
    'tree helpDefinitions title set')

  const helpDescription2 = 'my other title'
  commandsTree.setHelpDescription(helpDescription2)
  t.equal(commandsTree.helpDefinitions?.description, helpDescription2,
    'tree helpDefinitions other title set')

  const helpDescription3 = ' my trimmed title '
  commandsTree.setHelpDescription(helpDescription3)
  t.equal(commandsTree.helpDefinitions?.description, helpDescription3.trim(),
    'tree helpDefinitions trimmed title set')

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
      helpDefinitions: {
        description: 'The copy command'
      }
    },
    conf: {
      moduleRelativePath: 'conf.js'
    }
  })

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

  t.equal(copyCommandNode.getHelpDescription(), 'The copy command',
    'copy command title')

  const commandParts = copyCommandNode.getUnaliasedCommandParts()
  t.equal(commandParts.length, 1, 'unaliased array has one entry')
  t.equal(commandParts[0], 'copy', 'first command is copy')

  const helpDescription = 'my title'
  commandsTree.setHelpDescription(helpDescription)
  t.equal(commandsTree.helpDefinitions?.description, helpDescription,
    'tree helpDefinitions title set')

  const confCommandNode = commandsTree.findCommandNode(['conf'])
  t.equal(confCommandNode.moduleRelativePath, 'conf.js',
    '"conf" moduleRelativePath is conf.js')

  t.equal(confCommandNode.getHelpDescription(), helpDescription,
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
