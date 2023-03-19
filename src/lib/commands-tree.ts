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

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

import { Node } from './characters-node.js'
// Hack to keep the cli.SyntaxError notation consistent.
import * as cli from './error.js'

// ----------------------------------------------------------------------------

export interface FoundCommandModule {
  moduleRelativePath: string
  matchedCommands: string[]
  unusedCommands: string[]
}

// ============================================================================

export class CommandsTree {
  protected commandsTree: Node = new Node(null)
  protected unaliasedCommands: string[] = []
  protected moduleRelativePath?: string

  // No need for a constructor, all members were initialised.

  /**
   * @summary Add commands to the tree.
   *
   * @param commands Array of commands with possible aliases.
   * @param relativeFilePath Path to module that implements
   *   the command.
   *
   * @returns Nothing.
   *
   * @example
   * // Test with two aliases, one of them being also a shorthand.
   * addCommand(['test', 't', 'tst'], 'lib/xmake/test.js')
   */
  addCommand (
    commands: string | string[],
    relativeFilePath: string
  ): void {
    const commandsArray: string[] =
      Array.isArray(commands) ? commands : [commands]

    assert(commandsArray.length > 0 && commandsArray[0] !== undefined,
      'The command array must have at least one entry')

    // The first command in the array should be the full length one.
    const unaliasedCommand: string = commandsArray[0].trim()
    assert(unaliasedCommand.length > 0, 'The command must be non empty')

    this.unaliasedCommands.push(unaliasedCommand)

    const curedRelativeFilePath = relativeFilePath.trim()
    commandsArray.forEach((command) => {
      // Be sure the commands end with a space, and
      // multiple spaces are collapsed.
      const curedCommand: string =
        (command + ' ').toLowerCase().replace(/\s+/, ' ')

      // With empty parameter, split works at character level.
      const characters: string[] = curedCommand.split('')

      let node = this.commandsTree
      // Add children nodes for all characters, including the terminating space.
      characters.forEach((character) => {
        node = Node.add(
          node, character, curedRelativeFilePath, unaliasedCommand)
      })
    })
  }

  hasCommands (): boolean {
    return this.unaliasedCommands.length > 0
  }

  /**
   * @summary Get array of commands.
   *
   * @returns Array of strings with the commands.
   */
  getUnaliasedCommands (): string[] {
    return this.unaliasedCommands
  }

  /**
   * @summary Manually define the file to implement the command.
   * @param moduleRelativePath Path to module that implements
   *   the command.
   *
   * @returns Nothing.
   */
  setCommandFile (moduleRelativePath: string): void {
    this.moduleRelativePath = moduleRelativePath
  }

  /**
   * @summary Find a class that implements the commands.
   *
   * @param commands The commands, as entered.
   * @param rootPath The absolute path of the package.
   * @param parentClass The base class of all commands.
   * @returns
   *  An object with a class that implements the given command,
   *  the full command as a string array, and the remaining args.
   * @throws cli.SyntaxError The command was not recognised or
   *  is not unique, or the module does not implement CmdClass.
   *
   * @description
   * Walk down the commands tree and return the first module path encountered.
   * This means when a substring is deemed unique.
   *
   * To get the full command name, continue to walk down to a space.
   *
   * Due to circular references, cannot import cli.Command here,
   * so it must be passed from the caller.
   */
  findCommandModule (
    commands: string[]
    // rootPath: string
    // parentClass: typeof cli.Command
  ): FoundCommandModule {
    let fullCommands = ''
    let moduleRelativePath
    let remainingCommands: string[] = []

    if (this.moduleRelativePath !== undefined) {
      // Shortcut, for single command applications.
      moduleRelativePath = this.moduleRelativePath
    } else {
      assert((this.unaliasedCommands.length !== 0) &&
        (this.commandsTree !== null),
      'No commands defined yet.')

      // TODO: walk the tree.
      const str: string = commands.join(' ').trim() + ' '

      let node: Node = this.commandsTree
      const strArr = str.split('')
      fullCommands = ''
      let i: number
      for (i = 0; i < strArr.length; ++i) {
        const chr = strArr[i] ?? ''
        fullCommands += chr
        let found: Node | null = null
        for (const child of node.children) {
          if (chr === child.character) {
            found = child
            break
          }
        }
        if (found == null) {
          if (chr === ' ') {
            break
          }
          // TODO: suggest unique commands.
          throw new cli.SyntaxError(`Command '${str.trim()}' not supported.`)
        }
        node = found
        if (node.relativeFilePath !== undefined &&
          node.unaliasedCommand !== undefined) {
          moduleRelativePath = node.relativeFilePath
          fullCommands = node.unaliasedCommand.trim()
          break
        }
      }
      if (moduleRelativePath === undefined) {
        throw new cli.SyntaxError(`Command '${str.trim()}' is not unique.`)
      }
      remainingCommands = []
      for (; i < strArr.length; ++i) {
        if (strArr[i] === ' ') {
          if (i + 1 <= strArr.length - 1) {
            const str = strArr.slice(i + 1, strArr.length - 1).join('')
            if (str.length > 0) {
              remainingCommands = str.split(' ')
            }
          }
          break
        }
      }
    }

    return {
      moduleRelativePath,
      matchedCommands: fullCommands.split(' '),
      unusedCommands: remainingCommands
    }
  }
}

// ----------------------------------------------------------------------------
