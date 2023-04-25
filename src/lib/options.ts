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

// ----------------------------------------------------------------------------

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
 * @summary Option Definitions
 */
export interface OptionDefinition {
  /** Array of strings matching for the option;
   *   the longest string is displayed in help(). */
  options: string[]
  /** Mandatory function called to initialise an option. */
  init: InitOptionFunction
  /** Mandatory function called to set an option value. */
  action: SetOptionFunction

  /** True if the option should be followed by a value. */
  hasValue?: boolean
  /** Array of allowed values. */
  values?: string[]

  /** True if the option must be displayed
   *  surrounded by square brackets. False means mandatory. */

  /** True if the option is mandatory, false if it is optional. */
  isMandatory?: boolean

  helpDefinitions?: OptionHelpDefinitions
}

export interface OptionHelpDefinitions {
  /** A half line text to explain what the option does;
   * only options with descriptions are listed in help. */
  description?: string

  /** Name used to display the value in help, like `file`, `folder`, etc.
   * The default is `s`. The format is `--option=<s>`
  */
  valueDescription?: string

  /** A short description of the default value. */
  defaultValueDescription?: string

  /** True if it must be processed before
   *   other options, for example interactive options. */
  isRequiredEarly?: boolean

  /** True if the length of the line should not be considered
   * when computing the left column width.
   */
  isExtraLarge?: boolean

  /** True if it defines the option to get help;
   *   not displayed in the common list, but as a separate line. */
  isHelp?: boolean

  /** True if the option must be displayed
   *  followed by an asterisk. */
  isMultiple?: boolean
}

/**
 * @summary A group of options.
 */
export interface OptionsGroup {
  description: string
  isCommon?: boolean
  isInsertInFront?: boolean
  // TODO: rename optionsDefinitions
  optionsDefinitions: OptionDefinition[]
}

// ============================================================================

/**
 * @summary Manage CLI options.
 *
 * @description
 * Keep arrays of options.
 */
export class Options {
  // --------------------------------------------------------------------------

  /** A reference to the application context. */
  protected context: Context
  /** An array of groups of options. */
  public groups: OptionsGroup[] = []
  /** An array of groups of options, common to all commands. */
  public commonGroups: OptionsGroup[] = []

  /**
   * @summary Create an instance of the `Options` object.
   *
   * @param params.context Reference to context.
   * @param params.optionsGroups Optional array of option groups.
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
    assert(optionsGroups)

    optionsGroups.forEach((optionsGroup) => {
      if (optionsGroup.isCommon !== undefined && optionsGroup.isCommon) {
        if (optionsGroup.isInsertInFront !== undefined &&
          optionsGroup.isInsertInFront) {
          this.commonGroups = [optionsGroup, ...this.commonGroups]
        } else {
          this.commonGroups.push(optionsGroup)
        }
      } else {
        if (optionsGroup.isInsertInFront !== undefined &&
          optionsGroup.isInsertInFront) {
          this.groups = [optionsGroup, ...this.groups]
        } else {
          this.groups.push(optionsGroup)
        }
      }
    })
  }

  /**
   * @summary Add definitions to an existing group.
   *
   * @param optionsGroups Array of groups.
   * @returns Nothing.
   */
  appendToGroups (
    optionsGroups: OptionsGroup[]
  ): void {
    assert(optionsGroups)

    optionsGroups.forEach((paramOptionsGroup) => {
      const description: string = paramOptionsGroup.description
      const optionsDefinitions: OptionDefinition[] =
        paramOptionsGroup.optionsDefinitions
      const isInsertInFront: boolean =
        paramOptionsGroup.isInsertInFront ?? false

      const groups: OptionsGroup[] =
        (paramOptionsGroup.isCommon ?? false) ? this.commonGroups : this.groups

      groups.forEach((optionsGroup) => {
        assert(optionsGroup.description !== undefined)
        assert(optionsGroup.optionsDefinitions !== undefined)

        if (optionsGroup.description === description) {
          if (isInsertInFront) {
            optionsGroup.optionsDefinitions = [
              ...optionsDefinitions,
              ...optionsGroup.optionsDefinitions
            ]
          } else {
            optionsGroup.optionsDefinitions.push(...optionsDefinitions)
          }
        }
      })
    })
  }

  /**
   * @summary Parse options, common and specific to a command.
   *
   * @param argv Array of argument values.
   * @returns Array of remaining arguments and array of errors.
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
  ): {
      remainingArgv: string[]
      missingMandatoryErrors: string[]
    } {
    assert(argv)

    assert(this.context)
    const log = this.context.log
    log.trace(`${Function.prototype.name}()`)

    // In addition to common options, bring together all options from
    // all command option groups, if any.
    const allOptionDefinitions: OptionDefinition[] = []

    const allGroups = [...this.groups, ...this.commonGroups]
    allGroups.forEach((optionsGroup) => {
      assert(optionsGroup.optionsDefinitions !== undefined)
      allOptionDefinitions.push(...optionsGroup.optionsDefinitions)
    })

    // Initialise the configuration for all options.
    allOptionDefinitions.forEach((optionDefinition) => {
      optionDefinition.init(this.context)
    })

    // A set keeping track of processed options.
    const processedOptions = new Set<OptionDefinition>()

    const remainingArgv: string[] = []
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
        let opt: string = arg
        if (arg.includes('=')) {
          opt = arg.split('=', 1)[0] as string
        }
        for (const optionDefinition of allOptionDefinitions) {
          const aliases = optionDefinition.options
          // Iterate all aliases.
          for (const alias of aliases) {
            if (opt === alias) {
              i += this.processOption({
                argv,
                index: i,
                optionDefinition
              })
              processedOptions.add(optionDefinition)
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
        remainingArgv.push(arg)
      }
    }
    // If the previous look was terminated by a `--`,
    // copy the remaining arguments.
    for (; i < argv.length; ++i) {
      const arg = argv[i] ?? ''
      remainingArgv.push(arg)
    }

    // Check if any mandatory option is missing.
    const missingMandatoryErrors: string[] = []
    allOptionDefinitions.forEach((optionDefinition) => {
      // If the option is mandatory and was not processed.
      if (optionDefinition.isMandatory ?? false) {
        if (!processedOptions.has(optionDefinition)) {
          const option = optionDefinition.options.join('|')
          missingMandatoryErrors.push(`Mandatory '${option}' not found`)
        }

        // Validate, mandatory options should have no defaults.
        const helpDefinitions = optionDefinition.helpDefinitions ?? {}
        assert(helpDefinitions.defaultValueDescription === undefined)
      }
    })

    return { remainingArgv, missingMandatoryErrors }
  }

  /**
   * @summary Process an option.
   *
   * @param params.argv All input arguments.
   * @param params.index Index of the current arg.
   * @param params.optionDefinition Reference to the current option
   *   definition.
   * @returns 1 if the next arg was already consumed and should be skipped.
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
  protected processOption (params: {
    argv: string[]
    index: number
    optionDefinition: OptionDefinition
  }): number {
    assert(params.argv[params.index] !== undefined)
    const arg: string = params.argv[params.index] as string
    let value: string

    const optionDefinition = params.optionDefinition
    if (!(optionDefinition.hasValue ?? false)) {
      // If it has no value, treat it as a boolean option to be set to true;
      // The value is just for completeness, it needs not be used.
      optionDefinition.action(this.context, 'true')
      return 0
    }

    // The option has a value, which can be passed either in the same string
    // or as the next word.
    let consumeNext = 0
    if (arg.includes('=')) {
      value = arg.slice(arg.indexOf('=') + 1)
    } else {
      if (params.index >= (params.argv.length - 1)) {
        // Error, expected option value not available.
        throw new cli.SyntaxError(`'${arg}' expects a value`)
      }
      // Not the last option; engulf the next arg.
      value = params.argv[params.index + 1] ?? ''
      consumeNext = 1
    }

    // Values can be only an array of.
    if (Array.isArray(optionDefinition.values)) {
      // If a list of allowed values is present,
      // the option value must be validated.
      for (const allowedValue of optionDefinition.values) {
        if (value === allowedValue) {
          // If allowed, call the action to set the
          // configuration value
          optionDefinition.action(this.context, value)
          return consumeNext
        }
      }
      // Error, illegal option value
      throw new cli.SyntaxError(`Value '${value}' not allowed for '${arg}'`)
    } else {
      // Call the action to set the configuration value
      optionDefinition.action(this.context, value)
      return consumeNext
    }
  }
}

// ----------------------------------------------------------------------------
