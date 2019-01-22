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

const assert = require('assert')

const CliErrorSyntax = require('./cli-error.js').CliErrorSyntax

// ============================================================================

class CmdBaseNode {
  constructor (params = {}) {
    assert(params, 'There must be params.')

    this.name = params.name || ''
    this.aliases = params.aliases || []
    this.modulePath = params.modulePath
    if (params.className) {
      this.className = params.className
    }

    // Map of other CmdNode.
    this.children = {}
    // Tree of characters.
    this.charsTree = new CharsTree()
    // Array of CharNode, leaf of the CharsTree.
    this.endCharNode = []
  }

  addCommand (params) {
    assert(params)
    assert(params.name)
    assert(!this.children[params.name], 'Duplicate command.')

    const node = new CmdNode(params)
    this.children[params.name] = node
    node.parent = this

    return node
  }

  addCommands (params) {
    for (const [name, value] of Object.entries(params)) {
      const node = this.addCommand({
        name,
        ...value
      })
      if (value.subCommands) {
        node.addCommands(value.subCommands)
      }
    }
  }

  getCommandsNames () {
    return Object.keys(this.children).sort()
  }

  hasCommands () {
    return Object.keys(this.children).length > 0
  }

  buildCharTrees () {
    if (this.name && this.parent) {
      // Add the command name to the tree.
      this.parent.charsTree.addCommand({
        name: this.name,
        cmdNode: this
      })

      // Add all aliases to the tree, if any.
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

    for (const charNode of this.endCharNode) {
      charNode.promote()
    }
  }

  /**
   * @summary Identify the command node in the tree.
   *
   * @param {String[]} cmds Array of command and subcommands.
   * @returns {CmdNode} A command node.
   * @throws CliErrorSyntax(), if the command does not exist or is not unique.
   */
  findCommands (cmds) {
    assert(cmds.length > 0)

    const cmd = cmds[0]
    const rest = cmds.slice(1)

    let cmdNode = this.charsTree.findCommand(cmd)
    if (rest.length !== 0) {
      cmdNode = cmdNode.findCommands(cmds.slice(1))
    }

    assert(cmdNode.modulePath)
    return cmdNode
  }

  fullCommandPath () {
    if (this.parent) {
      return [ ...this.parent.fullCommandPath(), this.name ]
    }
    return [ this.name ]
  }
}

class CmdNode extends CmdBaseNode {
  constructor (params) {
    super(params)

    assert(params.name)
    assert(params.modulePath)
  }
}

class CmdsTree extends CmdBaseNode {
  fullCommandPath () {
    return []
  }
}

// ============================================================================

class CharBaseNode {
  constructor (params = {}) {
    this.char = params.char || ''

    this.children = {}
    // this.cmdNode = undefined
  }

  addChar (params) {
    assert(params)
    assert(params.char)

    if (this.children[params.char]) {
      return this.children[params.char]
    }

    const node = new CharNode(params)
    this.children[params.char] = node
    node.parent = this

    return node
  }

  hasCmdNode () {
    return (this.cmdNode !== undefined)
  }

  addCommand (params) {
    assert(params)
    assert(params.name)
    assert(params.cmdNode)

    const name = params.name.trim() + ' '
    let node = this
    for (const char of name) {
      node = node.addChar({
        char
      })
    }

    assert(!this.hasCmdNode())
    node.cmdNode = params.cmdNode

    assert(params.cmdNode.parent)
    params.cmdNode.parent.endCharNode.push(node)

    return node
  }

  promote () {
    if (this.parent && !this.parent.cmdNode &&
      Object.keys(this.parent.children).length === 1) {
      // Promote only if the node is the only child.
      this.parent.cmdNode = this.cmdNode
      this.parent.promote()
    }
  }

  findCommand (cmd) {
    const name = cmd.trim() + ' '
    let node = this

    let char
    for (char of name) {
      if (node.children[char]) {
        node = node.children[char]
      } else {
        break
      }
    }
    // If all chars were identified, node points to the terminating space.
    // A mismatch is not an error, if the command was uniquely identified.
    if (node.hasCmdNode()) {
      return node.cmdNode
    }

    if (char === ' ') {
      throw new CliErrorSyntax(`Command '${cmd}' is not unique.`)
    } else {
      throw new CliErrorSyntax(`Command '${cmd}' is not supported.`)
    }
  }
}

class CharNode extends CharBaseNode {
  constructor (params) {
    super(params)

    assert(params)
    assert(params.char)
  }
}

class CharsTree extends CharBaseNode {
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
