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
 * This file provides support to parse the command line arguments.
 *
 * GNU recommended options:
 * - https://www.gnu.org/prep/standards/html_node/Option-Table.html
 * (Every program accepting ‘--silent’ should accept ‘--quiet’ as a synonym.)
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// Hack to keep the cli.SyntaxError notation consistent.
import * as cli from './error.js'
import { Context } from './context.js'

// ----------------------------------------------------------------------------

// TODO: support --option=[value] (#26)
// TODO: support abbreviations, as long as unique (#27)
// (GNU also recommends to support concatenated single letter options)

// ============================================================================

/**
 * @callback InitOptionFunction
 * @param context Reference to context.
 */
type InitOptionFunction = (context: Context) => void

/**
 * @callback SetOptionFunction
 * @param context Reference to context.
 * @param value Value to set for the option.
 */
type SetOptionFunction = (context: Context, value: string) => void

/**
 * @typedef {Object} OptionDef
 * @property {string[]} options Array of strings matching for the option;
 *   the longest string is displayed in help().
 * @property {string} msg Message to display; only options with messages
 *   are displayed in help.
 * @property {setOption} action Mandatory function called to set an
 *   option value.
 * @property {initOption} init Mandatory function called to
 *   initialise an option.
 * @property {boolean} isHelp True if it defines the option to get help;
 *   not displayed in the common list, but as a separate line.
 * @property {boolean} doProcessEarly True if it must be processed before
 *   other options, for example interactive options.
 * @property {boolean} hasValue True if the option should be followed
 *  by a value
 * @property {string[]} values Array of allowed values.
 * @property {string} param Name used to display the value in help,
 *  like `file`, `folder`, etc.
 * @property {boolean} isOptional True if the option must be displayed
 *  surrounded by square brackets.
 * @property {boolean} isMultiple True if the option must be displayed
 *  followed by an asterisk.
 */

export interface OptionDefinition {
  options: string[]
  init: InitOptionFunction
  action: SetOptionFunction
  // Optional.
  message?: string
  isHelp?: boolean
  doProcessEarly?: boolean
  hasValue?: boolean
  values?: string[]
  param?: string
  isOptional?: boolean // false means isMandatory
  isMultiple?: boolean
  msgDefault?: string
  wasProcessed?: boolean
}

export interface OptionsGroup {
  title: string
  preOptions?: string
  postOptions?: string
  // TODO: rename optionsDefinitions
  optionsDefinitions: OptionDefinition[]
}

export interface OptionFoundModule {
  moduleRelativePath: string
  matchedCommands: string[]
  unusedCommands: string[]
}

// ----------------------------------------------------------------------------

/**
 * @classdesc
 * Internal class used to construct the tree of commands.
 *
 * The tree includes nodes for each character in the commands.
 * Leaves are always a space character.
 */
class Node {
  // --------------------------------------------------------------------------

  // Lowercase single letter;
  // The root node has a null character, as a terminator for searches.
  public character: string | null
  // Count how many paths this character is part of.
  // (to detect non-uniquely identified paths)
  public count: number = 0
  // Path to file implementing the command.
  // Nodes with multiple counts have the path removed, since
  // they cannot be uniquely identified.
  public relativeFilePath: string | undefined
  // The full length command (the first in the list)
  public unaliasedCommand: string | undefined
  public children: Node[] = []

  /**
   * @summary Add a character to the commands tree.
   *
   * @param parent The node to add the character as a child.
   * @param character One char string.
   * @param relativeFilePath Relative path to the file
   *   implementing the command.
   * @param unaliasedCommand Official command name (unaliased).
   * @returns The new node added to the tree.
   */
  static add (
    parent: Node,
    character: string | null,
    relativeFilePath: string,
    unaliasedCommand: string
  ): Node {
    assert(parent !== null, 'Null parent.')

    for (const child of parent.children) {
      if (child.character === character) {
        child.count += 1
        // If not unique, the file is unusable.
        child.relativeFilePath = undefined
        return child
      }
    }

    const node = new Node(character, relativeFilePath, unaliasedCommand)
    parent.children.push(node)
    return node
  }

  /**
   * @summary Create a tree node to store the character and the children nodes.
   *
   * @param character One char string.
   * @param relativeFilePath Relative path to the file
   *   implementing the command.
   * @param unaliasedCommand Official command name (unaliased).
   * @returns The newly created node.
   */
  constructor (
    character: string | null,
    relativeFilePath?: string,
    unaliasedCommand?: string
  ) {
    this.character = character != null ? character.toLowerCase() : null
    this.count = 1
    this.relativeFilePath = relativeFilePath
    this.unaliasedCommand = unaliasedCommand
    this.children = []
  }
}

// ============================================================================

/**
 * @classdesc
 * Manage CLI options and commands. Keep an array of options and a tree
 * of commands.
 *
 * This class is a bit unusual, since it has no instances, it is
 * basically a namespace for some data and functions.
 */

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Options {
  // --------------------------------------------------------------------------

  static context: Context
  static moduleRelativePath: string

  private static commandsTree: Node = new Node(null)
  private static unaliasedCommands: string[]
  private static commonOptionsGroups: OptionsGroup[]

  /**
   * @summary Static initialiser.
   *
   * @param context Reference to context.
   * @returns Nothing.
   */
  static initialise (context: Context): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    staticThis.context = context

    staticThis.commandsTree = new Node(null)
    staticThis.unaliasedCommands = []
    staticThis.commonOptionsGroups = []
  }

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
   * cli.Options.addCommand(['test', 't', 'tst'], 'lib/xmake/test.js')
   */
  static addCommand (
    commands: string | string[],
    relativeFilePath: string
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    const commandsArray: string[] =
      Array.isArray(commands) ? commands : [commands]

    assert(commandsArray.length > 0 && commandsArray[0] !== undefined,
      'The command array must have at least one entry')

    // The first command in the array should be the full length one.
    const unaliasedCommand: string = commandsArray[0].trim()
    assert(unaliasedCommand.length > 0, 'The command must be non empty')

    staticThis.unaliasedCommands.push(unaliasedCommand)

    const curedRelativeFilePath = relativeFilePath.trim()
    commandsArray.forEach((command) => {
      // Be sure the commands end with a space, and
      // multiple spaces are collapsed.
      const curedCommand: string =
        (command + ' ').toLowerCase().replace(/\s+/, ' ')

      // With empty parameter, split works at character level.
      const characters: string[] = curedCommand.split('')

      let node = staticThis.commandsTree
      // Add children nodes for all characters, including the terminating space.
      characters.forEach((character) => {
        node = Node.add(
          node, character, curedRelativeFilePath, unaliasedCommand)
      })
    })
  }

  /**
   * @summary Manually define the file to implement the command.
   * @param moduleRelativePath Path to module that implements
   *   the command.
   *
   * @returns Nothing.
   */
  static setCommandFile (moduleRelativePath: string): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    staticThis.moduleRelativePath = moduleRelativePath
  }

  /**
   * @summary Add option groups.
   *
   * @param optionsGroups Array of option groups.
   * @returns Nothing.
   *
   * @description
   * Preliminary solution with array instead of tree.
   */
  static addOptionsGroups (optionsGroups: OptionsGroup[]): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    optionsGroups.forEach((optionsGroup) => {
      staticThis.commonOptionsGroups.push(optionsGroup)
    })
  }

  /**
   * @summary Add definitions to an existing group.
   *
   * @param title Identifier of the option groups
   * @param optionDefinitions Array of definitions.
   * @returns Nothing.
   */
  static appendToOptionsGroups (
    title: string,
    optionDefinitions: OptionDefinition[]
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    staticThis.commonOptionsGroups.forEach((optionsGroup) => {
      assert(optionsGroup.title !== undefined)
      assert(optionsGroup.optionsDefinitions !== undefined)

      if (optionsGroup.title === title) {
        optionsGroup.optionsDefinitions.push(...optionDefinitions)
      }
    })
  }

  static hasCommands (): boolean {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this
    return staticThis.unaliasedCommands.length > 0
  }

  /**
   * @summary Get array of commands.
   *
   * @returns Array of strings with the commands.
   */
  static getUnaliasedCommands (): string[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    return staticThis.unaliasedCommands
  }

  /**
   * @summary Get array of option groups.
   *
   * @returns Array of option groups.
   */
  static getCommonOptionsGroups (): OptionsGroup[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    return staticThis.commonOptionsGroups
  }

  /**
   * @summary Parse options, common and specific to a command.
   *
   * @param argv Array of arguments.
   * @param context Reference to the context object
   * @param optionsGroups Optional reference to command specific options.
   * @returns Array of remaining arguments.
   *
   * @description
   * Iterate argv, and try to match all known options.
   *
   * Identified options will add/update properties of an
   * existing configuration.
   *
   * Arguments not identified as options are returned, in order.
   */
  static parseOptions (
    argv: string[],
    context: Context,
    optionsGroups: OptionsGroup[] | null = null
  ): string[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    assert(staticThis.context, 'cli.Context not initialised')
    const log = staticThis.context.log
    log.trace(`${Function.prototype.name}()`)

    // In addition to common options, bring together all options from
    // all command option groups, if any.
    const allOptionDefinitions: OptionDefinition[] = []
    if (optionsGroups == null) {
      staticThis.commonOptionsGroups.forEach((optionsGroup) => {
        assert(optionsGroup.optionsDefinitions !== undefined)
        allOptionDefinitions.push(...optionsGroup.optionsDefinitions)
      })
    } else {
      optionsGroups.forEach((optionsGroup) => {
        assert(optionsGroup.optionsDefinitions !== undefined)
        allOptionDefinitions.push(...optionsGroup.optionsDefinitions)
      })
    }

    allOptionDefinitions.forEach((optionDefinition) => {
      optionDefinition.wasProcessed = false
      optionDefinition.init(context)
    })

    const remainingArgs: string[] = []
    let wasProcessed = false
    let i = 0
    for (; i < argv.length; ++i) {
      const arg = argv[i] ?? ''
      if (arg === '--') {
        break
      }
      wasProcessed = false
      if (arg.startsWith('-')) {
        // If it starts with dash, it is an option.
        // Try to find it in the list of known options.
        for (const optionDefinition of allOptionDefinitions) {
          const aliases = optionDefinition.options
          // Iterate all aliases.
          for (const alias of aliases) {
            if (arg === alias) {
              i += staticThis.processOption(argv, i, optionDefinition, context)
              wasProcessed = true
              break
            }
          }
          if (wasProcessed) {
            break
          }
        }
      }
      if (!wasProcessed && arg !== undefined) {
        remainingArgs.push(arg)
      }
    }
    // If the previous look was terminated by a `--`,
    // copy the remaining arguments.
    for (; i < argv.length; ++i) {
      const arg = argv[i]
      if (arg !== undefined) {
        remainingArgs.push(arg)
      }
    }

    return remainingArgs
  }

  /**
   * @summary Check if mandatory option is missing.
   *
   * @param optionsGroups Array of option groups.
   * @returns Array of errors or null if everything is ok.
   */
  static checkMissingMandatory (
    optionsGroups: OptionsGroup[]
  ): string[] | null {
    const allOptionDefinitions: OptionDefinition[] = []
    optionsGroups.forEach((optionsGroup) => {
      assert(optionsGroup.optionsDefinitions !== undefined)
      allOptionDefinitions.push(...optionsGroup.optionsDefinitions)
    })

    const errors: string[] = []
    allOptionDefinitions.forEach((optionDefinition) => {
      if (!(optionDefinition.isOptional !== undefined &&
        optionDefinition.isOptional) &&
      !(optionDefinition.wasProcessed !== undefined &&
        optionDefinition.wasProcessed)) {
        const option = optionDefinition.options.join(' ')
        errors.push(`Mandatory '${option}' not found`)
      }
    })

    if (errors.length > 0) {
      return errors
    }

    // Everything is fine, no errors.
    return null
  }

  /**
   * @summary Process an option.
   *
   * @param argv All input arguments.
   * @param index Index of the current arg.
   * @param optionDefinition Reference to the current option
   *   definition.
   * @param context Reference to the context object, where to
   *  store the configuration values.
   * @returns 1 if the next arg should be skipped.
   *
   * @description
   * Processing the option means calling a function, that most probably
   * will add or update something in the configuration object.
   *
   * If the option has a separate value, it consumes it and informs
   * the caller to skip the next option.
   *
   * @todo process --opt=value syntax.
   */
  private static processOption (
    argv: string[],
    index: number,
    optionDefinition: OptionDefinition,
    context: Context
  ): number {
    const arg: string = argv[index] ?? ''
    let value: string
    // Values can be only an array, or null.
    // An array means the option takes a value.
    if ((optionDefinition.hasValue !== undefined &&
        optionDefinition.hasValue) ||
      optionDefinition.param !== undefined ||
      Array.isArray(optionDefinition.values)) {
      if (index < (argv.length - 1)) {
        // Not the last option; engulf the next arg.
        value = argv[index + 1] ?? ''
        // argv[index + 1].processed = true
      } else {
        // Error, expected option value not available.
        throw new cli.SyntaxError(`'${arg}' expects a value`)
      }
      if (Array.isArray(optionDefinition.values)) {
        // If a list of allowed values is present,
        // the option value must be validated.
        for (const allowedValue of optionDefinition.values) {
          if (value === allowedValue) {
            // If allowed, call the action to set the
            // configuration value
            optionDefinition.action(context, value)
            optionDefinition.wasProcessed = true
            return 1
          }
        }
        // Error, illegal option value
        throw new cli.SyntaxError(`Value '${value}' not allowed for '${arg}'`)
      } else {
        // Call the action to set the configuration value
        optionDefinition.action(context, value)
        optionDefinition.wasProcessed = true
        return 1
      }
    } else {
      // No list of allowed values defined, treat it as boolean true;
      // call the action to update the configuration.
      optionDefinition.action(context, 'true')
      optionDefinition.wasProcessed = true
      return 0
    }
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
   * To get the full command name, continue the walk down to a space.
   *
   * Due to circular references, cannot import cli.Command here,
   * so it must be passed from the caller.
   */
  static findCommandModule (
    commands: string[]
    // rootPath: string
    // parentClass: typeof cli.Command
  ): OptionFoundModule {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    let fullCommands = ''
    let moduleRelativePath
    let remainingCommands: string[] = []

    if (staticThis.moduleRelativePath !== undefined) {
      // Shortcut, for single command applications.
      moduleRelativePath = staticThis.moduleRelativePath
    } else {
      assert((staticThis.unaliasedCommands.length !== 0) &&
        (staticThis.commandsTree !== null),
      'No commands defined yet.')

      // TODO: walk the tree.
      const str: string = commands.join(' ').trim() + ' '

      let node: Node = staticThis.commandsTree
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

  /**
   * @summary Return args up to the first `--`.
   *
   * @param argv Array of strings.
   * @returns Possibly a shorter array.
   */
  static filterOwnArguments (argv: string[]): string[] {
    const ownArgs: string[] = []
    for (const arg of argv) {
      if (arg === '--') {
        break
      }
      ownArgs.push(arg)
    }
    return ownArgs
  }

  /**
   * @summary Return args after the first `--`, if any.
   *
   * @param argv Array of strings.
   * @returns A shorter array, possibly empty.
   */
  static filterOtherArguments (argv: string[]): string[] {
    const otherArgs: string[] = []
    let hasOther = false
    for (const arg of argv) {
      if (hasOther) {
        otherArgs.push(arg)
      } else if (arg === '--') {
        hasOther = true
        continue
      }
    }
    return otherArgs
  }
}

// ----------------------------------------------------------------------------
