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

// Hack to keep the cli.SyntaxError notation consistent.
import * as cli from './error.js'

// ----------------------------------------------------------------------------

interface CommandTemplateHelpOptions {
  title: string
  usageMoreOptions?: string
}
interface CommandTemplate {
  /** Optional array of command aliases. */
  aliases?: string[]
  /** Relative path to module source.
   * Mandatory if not defined by sub-commands */
  modulePath?: string
  /** Optional class name (default the first
   *  class derived from cli.Command in module) */
  className?: string
  /** Optional helper options */
  helpOptions?: CommandTemplateHelpOptions
  subCommands?: {
    [key: string]: CommandTemplate
  }
}

// interface CommandsDefinitionMap {
//   [key: string]: CommandTemplate
// }

export interface FoundCommandModule {
  moduleRelativePath: string
  className?: string | undefined
  matchedCommands: string[]
  unusedCommands: string[]
}

// ============================================================================

const characterTerminator = '.'

interface CommandNodeParams extends CommandTemplate {
  /** Command name. */
  name: string
}

// The commands and sub-commands are organised in a tree of command nodes.

class CommandBaseNode {
  /** The full, official name of the command. */
  public name: string
  /** Possible aliases of the command, usually shorter or even misspelled. */
  public aliases: string[]
  /** Path to the module implementing the command. */
  public modulePath?: string | undefined
  /** Optional class name, if multiple classes are in the same module. */
  public className?: string | undefined
  /** Optional properties used by the help subsystem. */
  public helpOptions?: CommandTemplateHelpOptions | undefined

  /** Link back to parent node, or undefined. */
  public parent?: CommandBaseNode

  /** Map of sub-command nodes, possibly empty. */
  public children: Map<string, CommandBaseNode> =
    new Map<string, CommandBaseNode>()

  /** Tree of characters with command name and aliases. */
  public charactersTree: CharactersTree = new CharactersTree()

  /**
   * Array of character nodes that point back to this command.
   * This is an optimisation, to avoid multiple back-searches.
   */
  public terminatorCharacterNodes: CharacterNode[] = []

  /** When more subcommands are given, return those that
   * wer not matched, to be returned to the caller. */
  public remainingCommands: string[] = []

  /**
   * @summary Construct a generic command node.
   *
   * @param params The generic parameters object.
   */
  constructor (params: CommandNodeParams) {
    assert(params)

    assert(params.name)
    this.name = params.name.trim()
    assert(this.name)
    assert(!this.name.includes(' '))

    this.aliases = params.aliases ?? []
    this.aliases.forEach((value, index, array) => {
      const str = value.trim()
      assert(!str.includes(' '))
      array[index] = str
    })

    this.modulePath = params.modulePath
    this.className = params.className

    // Map of options for the helper.
    this.helpOptions = params.helpOptions

    // Tree of characters. Built by buildCharactersTrees().
    this.charactersTree = new CharactersTree()
    // Array of CharacterNode
    this.terminatorCharacterNodes = []
  }

  get depth (): number {
    if (this.parent === undefined) {
      return 1
    }

    return 1 + this.parent.depth
  }

  /**
   * @summary Add a new command node to the current node.
   *
   * @param params The generic parameters object.
   * @returns The newly created command node.
   *
   * @descriptions
   * The command fails with an assert if an attempt to add a duplicate
   * command is identified. It does not bother to throw an exception,
   * because this is an application design issue, not an usage issue.
   *
   * The tree automatically maintains back references to the parent.
   */
  addCommandNode (params: CommandNodeParams): CommandNode {
    assert(params)
    assert(params.name)
    assert(!this.children.has(params.name), 'Duplicate command')

    const commandNode = new CommandBaseNode(params)
    this.children.set(params.name, commandNode)
    commandNode.parent = this

    return commandNode
  }

  /**
   * @summary Add all commands in the map as children nodes.
   *
   * @param params Map of named command node templates.
   * @returns Nothing.
   */
  addCommands (params: {
    [key: string]: CommandTemplate
  }): void {
    assert(params)

    for (const [name, value] of Object.entries(params)) {
      const commandNode: CommandNode = this.addCommandNode({
        name,
        ...value
      })
      if (value.subCommands !== undefined) {
        // Recursively add all subcommands.
        commandNode.addCommands(value.subCommands)
      }
    }
  }

  getModulePath (): string {
    if (this.modulePath !== undefined) {
      return this.modulePath
    }

    if (this.parent !== undefined) {
      return this.parent.getModulePath()
    }

    assert(false, `'${this.name}' must have modulePath`)
  }

  /**
   * @summary Check if the node has children commands.
   *
   * @returns True if there are children commands.
   */
  hasChildrenCommands (): boolean {
    return this.children.size > 0
  }

  /**
   * @summary Get the children command names of the current node.
   *
   * @returns Array of command names.
   */
  getChildrenCommandNames (): string[] {
    return [...this.children.keys()]
  }

  /**
   * @summary Build a character subtree for a name
   *
   * @param params.name A string with the name.
   * @returns The terminator node.
   */
  buildCharactersSubTree (params: {
    name: string
  }): CharacterNode {
    assert(this.parent)

    const characterTerminatorNode = this.parent.charactersTree.addCommand({
      name: params.name,
      commandNode: this
    })

    this.parent.terminatorCharacterNodes.push(characterTerminatorNode)

    return characterTerminatorNode
  }

  /**
   * @summary Build the internal char trees.
   *
   * @returns Nothing.
   *
   * @description
   * It recursively descends to children to create all trees,
   * for all nodes, with command name and aliases.
   */
  validateCommands (): void {
    if (this.parent != null) {
      // Add the command name to the parent tree.
      this.buildCharactersSubTree({
        name: this.name
      })

      // Add all aliases to the parent tree, if any.
      this.aliases.forEach((alias) => {
        this.buildCharactersSubTree({
          name: alias
        })
      })
    }

    // Recurse on all children.
    this.children.forEach((node) => {
      node.validateCommands()
    })

    // Once the current sub-tree (at each recursion level) is in place,
    // promote leafs to upper nodes, as long as unique.
    // This helps to match incomplete commands.
    this.charactersTree.promote()
  }

  /**
   * @summary Identify the command node in the tree.
   *
   * @param commands Array of commands and subcommands.
   * @returns A command node.
   * @throws cli.SyntaxError(), if the command does not exist or is not unique.
   *
   * @description
   * Recursively descends, if the command has subcommands.
   */
  findCommandNode (commands: string[]): CommandBaseNode {
    assert(Array.isArray(commands))
    assert(commands.length > 0)

    const command: string = commands[0] as string
    const restCommands = commands.slice(1)

    let commandNode = this.charactersTree.findCommandNode(command)
    if (commandNode.hasChildrenCommands()) {
      // If the node has further sub commands, possibly recurse,
      // else the remaining commands will be passed up to the caller.
      if (restCommands.length !== 0) {
        // If there are subcommands, recursively descend.
        commandNode = commandNode.findCommandNode(restCommands)
      }
    } else {
      commandNode.remainingCommands = restCommands
    }

    /* istanbul ignore next if */
    if (!(
      this.children !== undefined && this.children.size > 0
    )) {
      assert(commandNode.modulePath)
    }
    return commandNode
  }

  /**
   * @summary Get the list of full commands for the current node.
   *
   * @returns Array of commands.
   *
   * @description
   * For the assert not to trigger, the root node overrides this and
   * returns an empty array.
   */
  getUnaliasedSubCommands (): string[] {
    assert(this.parent)

    // Put parent in front.
    // The CommandTree ends the recursion.
    return [...this.parent.getUnaliasedSubCommands(), this.name]
  }
}

/**
 * @summary Command node.
 *
 * @description
 * It is a generic node with additional constructor constraints.
 */
class CommandNode extends CommandBaseNode {
  constructor (params: CommandNodeParams) {
    super(params)

    if (!((params.subCommands != null) &&
      Object.values(params.subCommands).length > 0)) {
      // If there are no sub-commands, the module must be defined.
      assert(params.modulePath,
        `'${params.name}' must have a modulePath`)
    }
  }

  /**
   * @summary Add a new command node to the current node.
   *
   * @param params The generic parameters object.
   * @returns The newly created command node.
   *
   * @descriptions
   * The command fails with an assert if an attempt to add a duplicate
   * command is identified. It does not bother to throw an exception,
   * because this is an application design issue, not an usage issue.
   *
   * The tree automatically maintains back references to the parent.
   */
  override addCommandNode (
    params: CommandNodeParams
  ): CommandNode {
    assert(params)
    assert(params.name)
    assert(!this.children.has(params.name), 'Duplicate command')

    const commandNode = new CommandNode(params)
    this.children.set(params.name, commandNode)
    commandNode.parent = this

    return commandNode
  }
}

/**
 * @public
 * @summary The root of the commands tree.
 *
 * @description
 * It is mainly a generic node with small changes.
 */
export class CommandsTree2 extends CommandNode {
  constructor () {
    super({
      name: '(tree)', // No spaces!
      modulePath: '.'
    })
  }

  /**
   * @summary Get the array of commands.
   * @returns An empty string array.
   *
   * @description
   * The top node has no commands.
   *
   * This is also used to end the
   * back recursion for children nodes.
   */
  override getUnaliasedSubCommands (): string[] {
    return []
  }

  /**
   * @summary Find a class that implements the commands.
   *
   * @param commands The commands, as entered.
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
  ): FoundCommandModule {
    assert(this.hasChildrenCommands(), 'No commands defined yet.')

    const commandNode = this.findCommandNode(commands)
    const depth = commandNode.depth

    return {
      moduleRelativePath: commandNode.getModulePath(),
      className: commandNode.className,
      matchedCommands: commandNode.getUnaliasedSubCommands(),
      unusedCommands: commands.slice(depth)
    }
  }
}

// ============================================================================

// Each command node keeps a tree of characters for its command and aliases.

class CharacterNode {
  /**
   * A single letter string, usually a lowercase. '^' for root node.
   */
  public char: string

  public children: Map<string, CharacterNode> =
    new Map<string, CharacterNode>()

  public parent?: CharacterNode

  /** Payload node. */
  public commandNode?: CommandNode
  /** Parent command node;
   * optimization, to avoid repetitive back searches. */
  public parentCommandNode?: CommandNode

  /**
   * @summary Construct a character node.
   * @param char A single character string, or null for the top node.
   */
  constructor (char: string) {
    assert(char.length === 1)
    this.char = char
  }

  /**
   * @summary Add a child node.
   *
   * @param char A single character.
   * @returns The new character node.
   *
   * @descriptions
   * The tree automatically maintains back references to the parent.
   */
  addChildNode (char: string): CharacterNode {
    assert(char !== undefined)
    assert(char.length === 1)

    // If the child exists, return it.
    if (this.children.has(char)) {
      return this.children.get(char) as CharacterNode
    }

    // In case it is necessary to created derived nodes, use this trick.
    // // @ts-expect-error
    // const node = new this.constructor(char)

    const node = new CharacterNode(char)
    this.children.set(char, node)
    node.parent = this

    return node
  }

  /**
   * @summary Check if the node has a command node associated.
   *
   * @returns True if the node has a command node.
   *
   * @description
   * When the tree is first created, only leaf nodes have references
   * to commands.
   *
   * After promotion, references are copied to parent nodes, as long
   * as the nodes have a single child.
   */
  hasCommandNode (): boolean {
    return (this.commandNode !== undefined)
  }

  /**
   * @summary Promote parent nodes.
   *
   * @returns Nothing.
   *
   * @description.
   * When the tree is first created, only leaf nodes have references
   * to commands.
   *
   * During promotion, references are copied to parent nodes, as long
   * as all children point to the same command, which means the command is
   * uniquely identified.
   *
   * This is an optimisation, to easily find partial commands in the tree.
   */
  promote (): void {
    if (this.hasCommandNode() || this.children.size === 0) {
      // No need to go deeper if the node already has a command node
      // or has no children.
      return
    }

    // The following works even if there is a singular child.

    // The node has children, recursively promote all.
    this.children.forEach((child) => { child.promote() })

    // Check if all have the same command node.
    let commandNode: CommandBaseNode | undefined
    for (const [, child] of this.children) {
      if (commandNode === undefined) {
        if (child.hasCommandNode()) {
          // The first time encounter, remember it for further tests.
          commandNode = child.commandNode
        } else {
          return
        }
      } else {
        // If not the same (note the object comparison!), the search is done.
        if (commandNode != child.commandNode) { // eslint-disable-line eqeqeq
          return
        }
      }
    }

    // All children have a commandNode and all are the same.
    if (commandNode !== undefined) {
      // Promote it to this node.
      this.commandNode = commandNode
    }
  }
}

/**
 * @summary The root of the tree of characters.
 *
 * @description
 * It is mainly a generic node with some extra functionality, to
 * add and retrieve commands.
 *
 * Each command node has a tree of characters, with the command
 * and its aliases.
 */
class CharactersTree extends CharacterNode {
  /**
   * @summary Create an instance of a tree.
   */
  constructor () {
    // No special meaning, just for debug sessions,
    // to easily identify the root node.
    super('^')
  }

  /**
   * @summary Add a command or a sub-command to the characters tree.
   *
   * @param params The generic parameters object.
   * @returns The terminator character node.
   */
  addCommand (params: {
    name: string
    commandNode: CommandNode
  }): CharacterNode {
    assert(params)

    assert(!this.hasCommandNode())

    // Create a name followed by the terminator.
    assert(params.name)
    const lowerCaseName = params.name.trim().toLowerCase() + characterTerminator
    assert(!lowerCaseName.includes(' '))

    assert(params.commandNode)
    assert(params.commandNode.parent)
    // All character nodes get a link to the parent command node.
    this.parentCommandNode = params.commandNode.parent

    // Start with the current node and add children one level at a time.
    let characterNode: CharacterNode = this as CharacterNode
    for (const char of lowerCaseName) {
      characterNode = characterNode.addChildNode(char)
      // All character nodes get a link to the parent command node.
      characterNode.parentCommandNode = params.commandNode.parent
    }

    // The bottom-most (terminator) node gets the command node.
    assert(!characterNode.hasCommandNode())
    characterNode.commandNode = params.commandNode

    return characterNode
  }

  /**
   * @summary Find a command node in the characters tree.
   *
   * @param command The command name, possibly aliased or shortened.
   * @returns The command node.
   *
   * @throws cli.SyntaxError() in case of errors.
   *
   * @description
   * Search the tree of characters and return the command node
   * if the command is identified as valid.
   *
   * Aliases are accepted, if defined.
   * Partial matches are also accepted, if unique.
   */
  findCommandNode (command: string): CommandBaseNode {
    assert(!command.includes(characterTerminator))

    // console.log(this.parentCmdNode.fullCommandsArray())...]
    assert(this.parentCommandNode)

    const lowerCaseName = command.trim().toLowerCase() + characterTerminator
    assert(lowerCaseName.length >= 2)
    assert(!lowerCaseName.includes(' '))

    let characterNode: CharacterNode = this as CharacterNode

    let char: string
    for (char of lowerCaseName) {
      if (characterNode.children.has(char)) {
        // Descend to the next node.
        characterNode = characterNode.children.get(char) as CharacterNode
      } else {
        // Character not found, possible error.
        break
      }
    }

    // If all chars were matched, the node points to the terminating char.
    // eslint-disable-next-line max-len
    // @ts-expect-error (Variable 'char' is used before being assigned. ts(2454))
    if (char === characterTerminator) {
      // If the command was uniquely identified, we're fine.
      if (characterNode.hasCommandNode()) {
        return characterNode.commandNode as CommandBaseNode
      } else {
        // We reached the end of the input name before identifying the
        // command node.
        throw new cli.SyntaxError(`Command '${command}' is not unique.`)
      }
    }

    // TODO: check the logic
    if (characterNode.children.has(characterTerminator)) {
      // There is not a matching character.
      throw new cli.SyntaxError(
        `Command '${command}' not fully identified, probably misspelled.`)
    } else {
      const commands = [...this.parentCommandNode.getUnaliasedSubCommands(),
        command]
      const str = commands.join(' ')
      throw new cli.SyntaxError(`Command '${str}' is not supported.`)
    }
  }
}

// ----------------------------------------------------------------------------
