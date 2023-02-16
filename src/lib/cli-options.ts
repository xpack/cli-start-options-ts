/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/MIT/.
 */

/* eslint valid-jsdoc: "error" */
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
import * as path from 'node:path'

// ----------------------------------------------------------------------------

import { CliErrorSyntax } from './cli-error.js'
import { CliContext } from './cli-context.js'

// ----------------------------------------------------------------------------

// TODO: support --option=[value]
// TODO: support abbreviations, as long as unique
// (GNU also recommends to support concatenated single letter options)

// ============================================================================

/**
 * @callback InitOptionFunction
 * @param {Object} context Reference to context.
 */
type InitOptionFunction = (context: CliContext) => void

/**
 * @callback SetOptionFunction
 * @param {Object} context Reference to context.
 * @param {Object} value Value to set for the option.
 */
type SetOptionFunction = (context: CliContext, value?: string) => void

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

export interface CliOptionDefinition {
  options: string[]
  init: InitOptionFunction
  action: SetOptionFunction
  // Optional.
  // TODO: rename message
  msg?: string
  isHelp?: boolean
  doProcessEarly?: boolean
  hasValue?: boolean
  values?: string[]
  param?: string
  isOptional?: boolean
  isMultiple?: boolean
  msgDefault?: string
  wasProcessed?: boolean
}

export interface CliOptionGroup {
  title: string
  preOptions?: string
  postOptions?: string
  // TODO: rename optionDefinitions
  optionDefs: CliOptionDefinition[]
}

// ----------------------------------------------------------------------------

/**
 * @classdesc
 * Internal class used to construct the tree of commands.
 *
 * The tree includes nodes for each character in the commands.
 * Leaves are always a space character.
 */
class CliNode {
  // --------------------------------------------------------------------------

  public character: string | null
  public count: number = 0
  public relativeFilePath: string | null = null
  public unaliasedCommand: string | null = null
  public children: CliNode[] = []

  /**
   * @summary Add a character to the commands tree.
   *
   * @param {CliNode} parent The node to add the character as a child.
   * @param {string} character One char string.
   * @param {string} relativeFilePath Relative path to the file
   *   implementing the command.
   * @param {string} unaliased Official command name (unaliased).
   * @returns {CliNode} The new node added to the tree.
   */
  static add (
    parent: CliNode,
    character: string | null,
    relativeFilePath: string | null,
    unaliased: string
  ): CliNode {
    assert(parent !== null, 'Null parent.')

    for (const child of parent.children) {
      if (child.character === character) {
        child.count += 1
        child.relativeFilePath = null
        return child
      }
    }

    const node = new CliNode(character, relativeFilePath, unaliased)
    parent.children.push(node)
    return node
  }

  /**
   * @summary Create a tree node to store the character and the children nodes.
   *
   * @param {string} character One char string.
   * @param {string} relativeFilePath Relative path to the file
   *   implementing the command.
   * @param {string} unaliasedCommand Official command name (unaliased).
   * @returns {CliNode} The newly created node.
   */
  constructor (
    character: string,
    relativeFilePath: string,
    unaliasedCommand: string | null = null
  ) {
    this.character = character ? character.toLowerCase() : null
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
 */
/* eslint @typescript-eslint/no-extraneous-class: off */
export class CliOptions {
  // --------------------------------------------------------------------------

  static context: CliContext
  static moduleRelativePath: string = undefined

  private static commandsTree: CliNode | undefined = undefined
  private static commandFirstArray: string[] | undefined = undefined
  private static commonOptionGroups: CliOptionGroup[] | undefined = undefined

  /**
   * @summary Static initialiser.
   *
   * @param {Object} context Reference to context.
   * @returns {undefined} Nothing.
   */
  static initialise (context: CliContext): void {
    /* eslint @typescript-eslint/no-this-alias: off */
    const staticThis = this

    staticThis.context = context
  }

  /**
   * @summary Add commands to the tree.
   *
   * @param {string[]} commands Array of commands with possible aliases.
   * @param {string} relativeFilePath Path to module that implements
   *   the command.
   *
   * @returns {undefined} Nothing.
   *
   * @example
   * // Test with two aliases, one of them being also a shorthand.
   * CliOptions.addCommand(['test', 't', 'tst'], 'lib/xmake/test.js')
   */
  static addCommand (
    commands: string | string[],
    relativeFilePath: string
  ): void {
    const staticThis = this

    const commandsArray: string[] =
      Array.isArray(commands) ? commands : [commands]
    const unaliasedCommand: string = commandsArray[0]

    commandsArray.forEach((command, index) => {
      // Be sure the commands end with a space, and
      // multiple spaces are collapsed.
      const curedCommand: string =
        (command + ' ').toLowerCase().replace(/\s+/, ' ')
      // With empty parameter, split works at character level.
      const commandsArray: string[] = curedCommand.split('')

      if (!staticThis.commandsTree) {
        staticThis.commandsTree = new CliNode(null, null)
      }

      let node = staticThis.commandsTree
      commandsArray.forEach((val, ix) => {
        node = CliNode.add(node, val, relativeFilePath, unaliasedCommand)
      })

      if (index === 0) {
        if (!staticThis.commandFirstArray) {
          staticThis.commandFirstArray = []
        }
        staticThis.commandFirstArray.push(curedCommand.split(' ')[0])
      }
    })
  }

  /**
   * @summary Define the file to implement the command.
   * @param {string} moduleRelativePath Path to module that implements
   *   the command.
   *
   * @returns {undefined} Nothing.
   */
  static setCommandFile (moduleRelativePath: string): void {
    const staticThis = this

    staticThis.moduleRelativePath = moduleRelativePath
  }

  /**
   * @summary Add option groups.
   *
   * @param {Object|object[]} optionGroups One or more option groups.
   * @returns {undefined} Nothing.
   *
   * @description
   * Preliminary solution with array instead of tree.
   */
  static addOptionGroups (optionGroups: CliOptionGroup[]): void {
    const staticThis = this

    if (!staticThis.commonOptionGroups) {
      staticThis.commonOptionGroups = []
    }
    optionGroups.forEach((od) => {
      staticThis.commonOptionGroups.push(od)
    })
  }

  static appendToOptionGroups (
    title: string,
    optionDefinitions: CliOptionDefinition[]
  ): void {
    const staticThis = this

    staticThis.commonOptionGroups.forEach((optionGroup) => {
      assert(optionGroup.title !== undefined)
      assert(optionGroup.optionDefs !== undefined)

      if (optionGroup.title === title) {
        optionGroup.optionDefs =
          optionGroup.optionDefs.concat(optionDefinitions)
      }
    })
  }

  static hasCommands (): string[] | null {
    const staticThis = this
    return staticThis.commandFirstArray
  }

  /**
   * @summary Get array of commands.
   *
   * @returns {string[]} Array of strings with the commands.
   */
  static getCommandsFirstArray (): string[] | undefined {
    const staticThis = this

    return staticThis.commandFirstArray
  }

  /**
   * @summary Get array of option groups.
   *
   * @returns {Object[]} Array of option groups.
   */
  static getCommonOptionGroups (): CliOptionGroup[] {
    const staticThis = this

    return staticThis.commonOptionGroups
  }

  /**
   * @summary Parse options, common and specific to a command.
   *
   * @param {string[]} args Array of arguments.
   * @param {Object} context Reference to the context object
   * @param {Array} optionGroups Optional reference to command specific options.
   * @returns {string[]} Array of remaining arguments.
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
    args: string[],
    context: CliContext,
    optionGroups: CliOptionGroup[] | null = null
  ): string[] {
    const staticThis = this

    assert(staticThis.context, 'CliContext not initialised')
    const log = staticThis.context.log
    log.trace('parseOptions()')

    // In addition to common options, bring together all options from
    // all command option groups, if any.
    let allOptionDefinitions = []
    if (!optionGroups) {
      staticThis.commonOptionGroups.forEach((optionGroup) => {
        assert(optionGroup.optionDefs !== undefined)
        allOptionDefinitions =
          allOptionDefinitions.concat(optionGroup.optionDefs)
      })
    } else {
      optionGroups.forEach((optionGroup) => {
        assert(optionGroup.optionDefs !== undefined)
        allOptionDefinitions =
          allOptionDefinitions.concat(optionGroup.optionDefs)
      })
    }

    allOptionDefinitions.forEach((optDef) => {
      optDef.wasProcessed = false
      optDef.init(context)
    })

    const remainingArgs: string[] = []
    let wasProcessed = false
    let i = 0
    for (; i < args.length; ++i) {
      const arg = args[i]
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
              i += staticThis.processOption(args, i, optionDefinition, context)
              wasProcessed = true
              break
            }
          }
          if (wasProcessed) {
            break
          }
        }
      }
      if (!wasProcessed) {
        remainingArgs.push(arg)
      }
    }
    // If the previous look was terminated by a `--`,
    // copy the remaining arguments.
    for (; i < args.length; ++i) {
      const arg = args[i]
      remainingArgs.push(arg)
    }

    return remainingArgs
  }

  /**
   * @summary Check if mandatory option is missing.
   *
   * @param {Object[]} optionGroups Array of option groups.
   * @returns {string[]|null} Array of errors or null if everything is ok.
   */
  static checkMissing (optionGroups: CliOptionGroup[]): string[] | null {
    let allOptionDefinitions: CliOptionDefinition[] = []
    if (optionGroups) {
      optionGroups.forEach((optionGroup) => {
        assert(optionGroup.optionDefs !== undefined)
        allOptionDefinitions =
          allOptionDefinitions.concat(optionGroup.optionDefs)
      })
    }

    const errors: string[] = []
    allOptionDefinitions.forEach((optDef) => {
      if (!optDef.isOptional && !optDef.wasProcessed) {
        const opt = optDef.options.join(' ')
        errors.push(`Mandatory '${opt}' not found`)
      }
    })

    if (errors.length > 0) {
      return errors
    }
    return null
  }

  /**
   * @summary Process an option.
   *
   * @param {string[]} args All input args.
   * @param {number} index Index of the current arg.
   * @param {Object} optionDefinition Reference to the current option
   *   definition.
   * @param {Object} context Reference to the context object, where to
   *  store the configuration values.
   * @returns {number} 1 if the next arg should be skipped.
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
    args: string[],
    index: number,
    optionDefinition: CliOptionDefinition,
    context: CliContext
  ): number {
    const arg: string = args[index]
    let value = null
    // Values can be only an array, or null.
    // An array means the option takes a value.
    if (optionDefinition.hasValue || optionDefinition.param ||
      Array.isArray(optionDefinition.values)) {
      if (index < (args.length - 1)) {
        // Not the last option; engulf the next arg.
        value = args[index + 1]
        // args[index + 1].processed = true
      } else {
        // Error, expected option value not available.
        throw new CliErrorSyntax(`'${arg}' expects a value`)
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
        throw new CliErrorSyntax(`Value '${value}' not allowed for '${arg}'`)
      } else {
        // Call the action to set the configuration value
        optionDefinition.action(context, value)
        optionDefinition.wasProcessed = true
        return 1
      }
    } else {
      // No list of allowed values defined, call the action
      // to update the configuration.
      optionDefinition.action(context)
      optionDefinition.wasProcessed = true
      return 0
    }
  }

  /**
   * @summary Find a class that implements the commands.
   *
   * @param {string[]} commands The commands, as entered.
   * @param {string} rootPath The absolute path of the package.
   * @param {class} parentClass The base class of all commands.
   * @returns {{CmdClass: class, fullCommands: string[], rest: string[]}|null}
   *  An object with a class that implements the given command,
   *  the full command as a string array, and the remaining args.
   * @throws CliErrorSyntax The command was not recognised or
   *  is not unique, or the module does not implement CmdClass.
   *
   * @description
   * Walk down the commands tree and return the first module path encountered.
   * This means when a substring is deemed unique.
   *
   * To get the full command name, continue the walk down to a space.
   *
   * Due to circular references, cannot import CliCommand here,
   * so it must be passed from the caller.
   */
  /* eslint @typescript-eslint/explicit-function-return-type: off */
  static async findCommandClass (
    commands: string[],
    rootPath: string,
    parentClass
  ) {
    const staticThis = this

    let fullCommands = ''
    let moduleRelativePath = null
    let remaining: string[] = []

    if (staticThis.moduleRelativePath) {
      moduleRelativePath = staticThis.moduleRelativePath
    } else {
      assert((staticThis.commandFirstArray.length !== 0) &&
        (staticThis.commandsTree !== null),
      'No commands defined yet.')

      // TODO: walk the tree.
      const str: string = commands.join(' ').trim() + ' '

      let node: CliNode = staticThis.commandsTree
      const strArr = str.split('')
      fullCommands = ''
      let i: number
      for (i = 0; i < strArr.length; ++i) {
        const chr = strArr[i]
        fullCommands += chr
        let found: CliNode | null = null
        for (const child of node.children) {
          if (chr === child.character) {
            found = child
            break
          }
        }
        if (!found) {
          if (chr === ' ') {
            break
          }
          // TODO: suggest unique commands.
          throw new CliErrorSyntax(`Command '${str.trim()}' not supported.`)
        }
        node = found
        if (node.relativeFilePath) {
          moduleRelativePath = node.relativeFilePath
          fullCommands = node.unaliasedCommand.trim()
          break
        }
      }
      if (!moduleRelativePath) {
        throw new CliErrorSyntax(`Command '${str.trim()}' is not unique.`)
      }
      remaining = []
      for (; i < strArr.length; ++i) {
        if (strArr[i] === ' ') {
          if (i + 1 <= strArr.length - 1) {
            const str = strArr.slice(i + 1, strArr.length - 1).join('')
            if (str.length > 0) {
              remaining = str.split(' ')
            }
          }
          break
        }
      }
    }

    const modPath = path.join(rootPath, moduleRelativePath)

    // On Windows, absolute paths start with a drive letter, and the
    // explicit `file://` is mandatory.
    const moduleExports = await import(`file://${modPath.toString()}`)

    // Return the first exported class derived from parent class (`CliCommand`).
    for (const property in moduleExports) {
      const obj = moduleExports[property]
      /* eslint @typescript-eslint/strict-boolean-expressions: off */
      if (Object.prototype.isPrototypeOf.call(parentClass, obj)) {
        return {
          CommandClass: moduleExports[property],
          fullCommands: fullCommands.split(' '),
          rest: remaining
        }
      }
    }
    // Module not found
    /* eslint @typescript-eslint/restrict-template-expressions: off */
    assert(false, `A class derived from '${parentClass.name}' not ` +
      `found in '${modPath}'.`)
  }

  /**
   * @summary Return args up to the first `--`.
   *
   * @param {string[]} args Array of strings.
   * @returns {string[]} Possibly a shorter array.
   */
  static filterOwnArguments (args: string[]): string[] {
    const ownArgs: string[] = []
    for (const arg of args) {
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
   * @param {string[]} args Array of strings.
   * @returns {string[]} A shorter array, possibly empty.
   */
  static filterOtherArguments (args: string[]): string[] {
    const otherArgs: string[] = []
    let hasOther = false
    for (const arg of args) {
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
