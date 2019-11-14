/*
 * This file is part of the xPack distribution
 *   (http://xpack.github.io).
 * Copyright (c) 2018 Liviu Ionescu.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom
 * the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict'
/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/**
 * This file provides the data model for storing and processing commands.
 *
 * Outside this data model is seen as a tree of commands, implemented as
 * a tree root node with children nodes for each command and further
 * sub-nodes for sub-commands.
 *
 * Each command may have aliases, as long as they allow to uniquely identify
 * the commands.
 *
 * When trying to match a command, partial strings are accepted, down to
 * the limit which defines uniqueness.
 *
 * Internally, the command name and aliases are also stored as a tree
 * of characters.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')

const CliErrorSyntax = require('./cli-error.js').CliErrorSyntax

const charTerminator = '.'

// ============================================================================

class CmdBaseNode_ {
  /**
   * @summary Construct a generic command node.
   *
   * @param {Object} params The generic parameters object.
   * @param {String} params.name Command name.
   * @param {String[]} params.aliases Optional array of command aliases.
   * @param {String} params.modulePath Relative path to module source.
   * @param {String} params.className Optional class name (default the first
   *  class derived from CliCommand)
   */
  constructor (params = {}) {
    assert(params)

    this.name = params.name || ''
    this.aliases = params.aliases || []
    this.modulePath = params.modulePath
    if (params.className) {
      this.className = params.className
    }

    // Map of other CmdNode.
    this.children = {}
    // Tree of characters.
    this.charsTree = new CharsTree_()
    // Array of CharNode, leaf of the CharsTree.
    this.endCharNode = []
  }

  /**
   * @summary Add a new command node to the current node.
   *
   * @param {Object} params The generic parameters object.
   * @param {String} params.name Command name.
   * @param {String[]} params.aliases Optional array of command aliases.
   * @param {String} params.modulePath Relative path to module source.
   * @param {String} params.className Optional class name (default the first
   *  class derived from CliCommand)
   *
   * @returns {CmdBaseNode_} The newly created command node.
   *
   * @descriptions
   * The command fails with an assert if an attempt to add a duplicate
   * command is identified. It does not bother to throw an exception,
   * because this is an application design issue, not an usage issue.
   *
   * The tree automatically maintains back references to the parent.
   */
  addCommandNode (params) {
    assert(params)
    assert(params.name)
    assert(!this.children[params.name], 'Duplicate command.')

    const node = new CmdNode_(params)
    this.children[params.name] = node
    node.parent = this

    return node
  }

  /**
   * @summary Add all commands in the map.
   *
   * @param {Object} params Map of named command node templates.
   * @returns {undefined} Nothing.
   */
  addCommands (params) {
    for (const [name, value] of Object.entries(params)) {
      const node = this.addCommandNode({
        name: name,
        ...value
      })
      if (value.subCommands) {
        node.addCommands(value.subCommands)
      }
    }
  }

  /**
   * @summary Get the children command names of the current node.
   *
   * @returns {String[]} Array of command names.
   */
  getCommandsNames () {
    return Object.keys(this.children).sort()
  }

  /**
   * @summary Check if the node has children commands.
   *
   * @returns {Boolean} True if there are children commands.
   */
  hasCommands () {
    return Object.keys(this.children).length > 0
  }

  /**
   * @summary Build the internal char trees.
   *
   * @returns {undefined} Nothing.
   *
   * @description
   * It recursively descends to children to create all trees,
   * for all nodes.
   */
  buildCharTrees () {
    if (this.name && this.parent) {
      // Add the command name to the parent tree.
      this.parent.charsTree.addCommand({
        name: this.name,
        cmdNode: this
      })

      // Add all aliases to the parent tree, if any.
      for (const alias of this.aliases) {
        this.parent.charsTree.addCommand({
          name: alias,
          cmdNode: this
        })
      }
    }

    // Recursively process subcommands, if any.
    for (const node of Object.values(this.children)) {
      node.buildCharTrees()
    }

    // Once the tree is in place, promote leafs to upper nodes.
    for (const charNode of this.endCharNode) {
      charNode.promote()
    }
  }

  /**
   * @summary Identify the command node in the tree.
   *
   * @param {String[]} commands Array of commands and subcommands.
   * @returns {CmdNode_} A command node.
   * @throws CliErrorSyntax(), if the command does not exist or is not unique.
   *
   * @description
   * Recursively descends, if the command has subcommands.
   */
  findCommands (commands) {
    assert(Array.isArray(commands))
    assert(commands.length > 0)

    const command = commands[0]
    const restCommands = commands.slice(1)

    let cmdNode = this.charsTree.findCommand(command)
    if (cmdNode.hasCommands()) {
      // If the node has further sub commands, possibly recurse,
      // else the remaining commands will be passed up to the caller.
      if (restCommands.length !== 0) {
        // If there are subcommands, recursively descend.
        cmdNode = cmdNode.findCommands(restCommands)
      }
    } else {
      cmdNode.restCommands = restCommands
    }

    assert(cmdNode.modulePath)
    return cmdNode
  }

  /**
   * @summary Get the list of full commands for the current node.
   *
   * @returns {String[]} Array of commands.
   *
   * @description
   * For the assert not to trigger, the root node overrides this and
   * returns an empty array.
   */
  fullCommandsArray () {
    assert(this.parent)

    // Put parent in front.
    return [...this.parent.fullCommandsArray(), this.name]
  }
}

/**
 * @summary Command node.
 *
 * @description
 * It is a generic node with additional constructor constraints.
 */
class CmdNode_ extends CmdBaseNode_ {
  constructor (params) {
    super(params)

    assert(params.name)
    assert(params.modulePath)
  }
}

/**
 * @public
 * @summary The root of the commands tree.
 *
 * @description
 * It is mainly a generic node with small changes.
 */
class CmdsTree extends CmdBaseNode_ {
  fullCommandsArray () {
    return []
  }
}

CmdsTree.charTerminator = charTerminator

// ============================================================================

class CharBaseNode_ {
  /**
   * @summary Construct a character node.
   * @param {String} char If present, a single character.
   */
  constructor (char) {
    this.char = char || ''

    this.children = {}
    this.cmdNode = undefined
  }

  /**
   * @summary Add a character sub-node.
   *
   * @param {String} char A single character.
   * @returns {CharNode_} The new character node.
   *
   * @descriptions
   * The tree automatically maintains back references to the parent.
   */
  addCharNode (char) {
    assert(char)

    if (this.children[char]) {
      return this.children[char]
    }

    const node = new CharNode_(char)
    this.children[char] = node
    node.parent = this

    return node
  }

  /**
   * @summary Check if the node has a command node associated.
   *
   * @returns {Boolean} True if the node has a command node.
   *
   * @description
   * When the tree is first created, only leaf nodes have references
   * to commands.
   *
   * After promotion, references are copied to parent nodes, as long
   * as the nodes have a single child.
   */
  hasCmdNode () {
    return (this.cmdNode !== undefined)
  }

  /**
   * @summary Promote parent nodes.
   *
   * @returns {undefined} Nothing.
   *
   * @description.
   * When the tree is first created, only leaf nodes have references
   * to commands.
   *
   * During promotion, references are copied to parent nodes, as long
   * as the nodes have a single child, which means the command is
   * uniquely identified.
   *
   * The process walks the tree up as much as possible.
   */
  promote () {
    if (this.parent && !this.parent.cmdNode &&
      Object.keys(this.parent.children).length === 1) {
      // Promote only if the node is the only child.
      this.parent.cmdNode = this.cmdNode
      this.parent.promote()
    }
  }
}

/**
 * @summary Character node.
 *
 * @description
 * It is a generic node with additional constructor constraints.
 */
class CharNode_ extends CharBaseNode_ {
  constructor (char) {
    super(char)

    assert(char)
  }
}

/**
 * @summary The root of the tree of characters.
 *
 * @description
 * It is mainly a generic node with som extra functionality.
 */
class CharsTree_ extends CharBaseNode_ {
  /**
   * @summary Add a command to the tree.
   *
   * @param {Object} params The generic parameters object.
   * @param {String} params.name The command name.
   * @param {CmdNode_} params.cmdNode Reference to the command node.
   * @returns {CharNode_} The leaf character node (of the terminator).
   */
  addCommand (params) {
    assert(params)

    assert(!this.hasCmdNode())
    assert(params.cmdNode)
    assert(params.cmdNode.parent)
    this.parentCmdNode = params.cmdNode.parent

    assert(params.name)
    const name = params.name.trim() + charTerminator
    let node = this
    for (const char of name) {
      node = node.addCharNode(char)
      node.parentCmdNode = params.cmdNode.parent
    }

    node.cmdNode = params.cmdNode

    params.cmdNode.parent.endCharNode.push(node)

    return node
  }

  /**
   * @summary Find a command in the tree.
   *
   * @param {String} command The command name.
   * @returns {CmdNode_} The command node.
   */
  findCommand (command) {
    assert(command.indexOf(charTerminator) === -1)

    // console.log(this.parentCmdNode.fullCommandsArray())...]
    const allCmds = [...this.parentCmdNode.fullCommandsArray(), command]
    const str = allCmds.join(' ')

    const name = command.trim() + charTerminator
    let node = this

    let char
    for (char of name) {
      if (node.children[char]) {
        node = node.children[char]
      } else {
        // End of input command reached, all chars matched.
        break
      }
    }

    // If all chars were matched, node points to the terminating char.
    if (char === charTerminator) {
      // If the command was uniquely identified, we're fine.
      if (node.hasCmdNode()) {
        return node.cmdNode
      } else {
        // We reached the end of the input name before identifying the
        // command node.
        throw new CliErrorSyntax(`Command '${command}' is not unique.`)
      }
    }

    if (node.children[charTerminator]) {
      // There is not a matching character.
      throw new CliErrorSyntax(
        `Command '${command}' not fully identified, probably mispelled.`)
    } else {
      throw new CliErrorSyntax(`Command '${str}' is not supported.`)
    }
  }
}

// ============================================================================

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The class is added as a property of this object.
module.exports.CmdsTree = CmdsTree

// In ES6, it would be:
// export class CmdsTree { ... }
// ...
// import { CmdsTree } from '../utils/dm-commands.js'

// ----------------------------------------------------------------------------
