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
  isRequiredEarly?: boolean
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
  isCommon?: boolean
  preOptions?: string
  postOptions?: string
  // TODO: rename optionsDefinitions
  optionsDefinitions: OptionDefinition[]
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

  public groups: OptionsGroup[] = []
  public commonGroups: OptionsGroup[] = []
  protected context: Context

  /**
   * @constructor
   *
   * @param context Reference to context.
   */
  constructor (params: {
    context: Context
    optionsGroups?: OptionsGroup[]
  }) {
    assert(params)
    assert(params.context)

    this.context = params.context

    if (params.optionsGroups !== undefined) {
      this.addGroups(params.optionsGroups)
    }
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
  addGroups (optionsGroups: OptionsGroup[]): void {
    optionsGroups.forEach((optionsGroup) => {
      if (optionsGroup.isCommon !== undefined && optionsGroup.isCommon) {
        this.commonGroups.push(optionsGroup)
      } else {
        this.groups.push(optionsGroup)
      }
    })
  }

  /**
   * @summary Add definitions to an existing group.
   *
   * @param title Identifier of the option groups
   * @param optionDefinitions Array of definitions.
   * @returns Nothing.
   */
  appendToGroup (
    title: string,
    optionDefinitions: OptionDefinition[]
  ): void {
    [...this.groups, ...this.commonGroups].forEach((optionsGroup) => {
      assert(optionsGroup.title !== undefined)
      assert(optionsGroup.optionsDefinitions !== undefined)

      if (optionsGroup.title === title) {
        optionsGroup.optionsDefinitions.push(...optionDefinitions)
      }
    })
  }

  /**
   * @summary Initialise the configuration properties.
   */
  initializeConfiguration (): void {
    [...this.groups, ...this.commonGroups].forEach((optionsGroup) => {
      optionsGroup.optionsDefinitions.forEach((optionDefinition) => {
        optionDefinition.init(this.context)
        optionDefinition.wasProcessed = false
      })
    })
  }

  /**
   * @summary Parse options, common and specific to a command.
   *
   * @param argv Array of arguments.
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
  parse (
    argv: string[]
  ): string[] {
    assert(this.context, 'cli.Context not initialised')
    const log = this.context.log
    log.trace(`${Function.prototype.name}()`)

    // In addition to common options, bring together all options from
    // all command option groups, if any.
    const allOptionDefinitions: OptionDefinition[] = []

    this.groups.forEach((optionsGroup) => {
      assert(optionsGroup.optionsDefinitions !== undefined)
      allOptionDefinitions.push(...optionsGroup.optionsDefinitions)
    })

    this.commonGroups.forEach((optionsGroup) => {
      assert(optionsGroup.optionsDefinitions !== undefined)
      allOptionDefinitions.push(...optionsGroup.optionsDefinitions)
    })

    allOptionDefinitions.forEach((optionDefinition) => {
      optionDefinition.wasProcessed = false
      optionDefinition.init(this.context)
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
              i += this.processOption(argv, i, optionDefinition)
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
   * @returns Array of errors or null if everything is ok.
   */
  checkMissingMandatory (): string[] | null {
    const allOptionDefinitions: OptionDefinition[] = []
    this.groups.forEach((optionsGroup) => {
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
  protected processOption (
    argv: string[],
    index: number,
    optionDefinition: OptionDefinition
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
            optionDefinition.action(this.context, value)
            optionDefinition.wasProcessed = true
            return 1
          }
        }
        // Error, illegal option value
        throw new cli.SyntaxError(`Value '${value}' not allowed for '${arg}'`)
      } else {
        // Call the action to set the configuration value
        optionDefinition.action(this.context, value)
        optionDefinition.wasProcessed = true
        return 1
      }
    } else {
      // No list of allowed values defined, treat it as boolean true;
      // call the action to update the configuration.
      optionDefinition.action(this.context, 'true')
      optionDefinition.wasProcessed = true
      return 0
    }
  }

  /**
   * @summary Return args up to the first `--`.
   *
   * @param argv Array of strings.
   * @returns Possibly a shorter array.
   */
  filterOwnArguments (argv: string[]): string[] {
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
  filterOtherArguments (argv: string[]): string[] {
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
