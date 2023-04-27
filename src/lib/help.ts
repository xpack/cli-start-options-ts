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

import { Context } from './context.js'
import {
  Options,
  OptionDefinition,
  OptionHelpDefinitions
} from './options.js'

// ----------------------------------------------------------------------------

/*
 * This file provides support for displaying the application and
 * command specific help.
 */

// ============================================================================

type CallableNoArgs = () => void

export class MultiPass {
  // --------------------------------------------------------------------------

  public isFirstPass: boolean = true
  public width: number = 0
  public limit: number = 0

  constructor (limit: number) {
    this.limit = limit
  }

  updateWidth (width: number): void {
    if (this.isFirstPass && width > this.width) {
      this.width = width
    }
  }

  reset (): void {
    this.isFirstPass = true
    this.width = 0
  }

  secondPass (): void {
    this.isFirstPass = false
    // One more is implicit, so a total 2 spaces between columns.
    this.width += 1
    if (this.width > this.limit) {
      this.width = this.limit
    }
  }

  get isSecondPass (): boolean {
    return !this.isFirstPass
  }
}

// ----------------------------------------------------------------------------

export interface HelpConstructorParams {
  context: Context
  isOutputAlways?: boolean
}

export class Help {
  // --------------------------------------------------------------------------

  protected context: Context

  public middleLimit: number
  public rightLimit: number
  public commands?: string[]
  public multiPass: MultiPass

  protected isOutputAlways: boolean

  constructor (params: HelpConstructorParams) {
    assert(params)
    assert(params.context)

    this.context = params.context
    this.isOutputAlways = params.isOutputAlways ?? false

    // Probably these should be automatically computed from the
    // terminal size.
    this.middleLimit = 40
    this.rightLimit = 79 // Do not write in col 80

    this.multiPass = new MultiPass(this.middleLimit)
  }

  output (message?: String): void {
    const context: Context = this.context

    const log = context.log

    if (this.isOutputAlways) {
      log.always(message)
    } else {
      log.output(message)
    }
  }

  outputSecondPass (message?: String): void {
    const multiPass = this.multiPass
    if (multiPass.isSecondPass) {
      this.output(message)
    }
  }

  outputMultiPassLine (params: {
    line: string
    description?: string
    skipUpdateWidth?: boolean
  }): void {
    assert(params)
    assert(params.line)

    const multiPass = this.multiPass

    let line: string = params.line.trimEnd()
    if (multiPass.isFirstPass) {
      if (!(params.skipUpdateWidth ?? false)) {
        multiPass.updateWidth(line.length)
      }
    } else {
      if (line.length >= multiPass.limit) {
        // If the line is longer than the limit, output it
        // alone and move the description to the next line.
        this.output(line)
        line = ''
      }
      assert(params.description)
      const description = params.description
      this.output(
        `${this.padRight(line, multiPass.width)} ${description.trim()}`)
    }
  }

  /**
   * @summary Call the function twice.
   * @param func Function to call.
   * @returns Nothing.
   */
  twoPassAlign (func: CallableNoArgs): void {
    this.multiPass.reset()
    func()
    this.multiPass.secondPass()
    func()
  }

  padRight (line: string, width: number): string {
    let str = line.trimEnd() // Do not trimStart(), some start with spaces.
    // Add the maximum number of spaces, most of the times too many.
    str += ' '.repeat(width)

    // Cut to the desired width.
    return str.substring(0, width)
  }

  // --------------------------------------------------------------------------

  /**
   * @summary Output the entire help content.
   * @param params The generic parameters object.
   * @param params.cmds Array of commands; not present for single
   *  commands.
   * @param params.object The application or command object.
   * @param params.commands The full, unaliased commands for a
   *   multi-command application.
   * @returns Nothing.
   */
  outputAll (): void {
    const context: Context = this.context

    assert(context.commandNode)
    assert(context.commandNode.helpDefinitions)

    // Start with an empty line.
    this.output()

    this.outputTitle()

    if (context.commandNode.hasChildrenCommands()) {
      this.outputAvailableCommands()
    } else {
      // No further sub-commands.
      this.outputCommandLine()
      this.outputCommandAliases()
    }

    // The special trick here is how to align the right column.
    // For this two steps are needed, with the first to compute
    // the max width of the first column, and then to output text.

    this.twoPassAlign(() => {
      this.outputAlignedCustomOptions() // Overridden in derived class.

      this.outputAlignedOptionsGroups()
      this.outputAlignedAllHelpDetails()
      this.outputAlignedEarlyDetails()
    })

    this.outputFooter()
  }

  // --------------------------------------------------------------------------

  /**
   * @summary Output command custom options.
   *
   * @description
   * Override this in a derived class to provide functionality.
   */
  outputAlignedCustomOptions (): void {
  }

  // --------------------------------------------------------------------------

  outputTitle (): void {
    const context: Context = this.context

    assert(context.commandNode)

    const description = context.commandNode.getHelpDescription()
    if (description.length > 0) {
      this.output(`${description}`)
      this.output()
    }
  }

  /**
   * @summary: Output the fully qualified command line with all visible options.
   *
   * @description
   * Output the command usage, by enumerating the options, with
   * possible values and markers for multiple apparitions.
   *
   * Split long lines and align subsequent lines after the command.
   */
  outputCommandLine (): void {
    const context: Context = this.context

    assert(context.commandNode)
    const commandParts =
      [context.programName, ...context.commandNode.getUnaliasedCommandParts()]
        .join(' ')

    const usage = `Usage: ${commandParts}`
    let line: string = usage

    const options: Options = context.options
    const optionsGroups = options.groups
    const optionDefinitions: OptionDefinition[] = []

    // Common groups are not shown here, only in the list below.
    optionsGroups.forEach((optionsGroup) => {
      optionDefinitions.push(...optionsGroup.optionsDefinitions)
    })

    // The preOption string allow commands to customise the command line
    // with a something to be shown before other options.
    const preOptions =
      this.context.commandNode?.helpDefinitions?.usagePreOptions ?? ''

    if (preOptions.length > 0) {
      line += ' ' + preOptions
    }
    line += ' [options...]'

    // Definitions look like:
    // --option - option without value
    // --option <s> - option with value
    // [--option <s>] - non-mandatory
    // [--option <s>]* - non mandatory, multiple
    // [--option <s>]+ - mandatory, multiple

    let definition: string
    optionDefinitions.forEach((optionDefinition) => {
      const helpDefinitions = optionDefinition.helpDefinitions ?? {}

      // Skip help and early definitions.
      if (!(helpDefinitions.isHelp ?? false) &&
        !(helpDefinitions.isRequiredEarly ?? false)
      ) {
        // Choose the longest alias, as the most readable.
        definition = ''
        optionDefinition.options.forEach((option) => {
          if (option.length > definition.length) {
            definition = option
          }
        })

        // Add value description.
        if ((optionDefinition.hasValue ?? false) ||
          (Array.isArray(optionDefinition.values) &&
            optionDefinition.values.length > 0)) {
          definition += ` <${helpDefinitions.valueDescription ?? 's'}>`
        }

        // Add braces and markers for multiple apparitions.
        if (!(optionDefinition.isMandatory ?? false)) {
          definition = `[${definition}]`
          if (helpDefinitions.isMultiple ?? false) {
            definition += '*'
          }
        } else if (helpDefinitions.isMultiple ?? false) {
          definition = `[${definition}]+`
        }

        // If there is not enough space on the current line,
        // output it and start a new line, aligned after the usage.
        if (line.length + definition.length + 1 > this.rightLimit) {
          this.output(line)
          line = ' '.repeat(usage.length)
        }

        // Contribute the definition to the current line.
        line += ' ' + definition
      }
    })

    // The postOption string allow commands to customise the command line
    // with a something to be shown after all other options.
    const postOptions =
      this.context.commandNode?.helpDefinitions?.usagePostOptions ?? ''

    if (postOptions.length > 0) {
      definition = postOptions
      if (line.length + definition.length + 1 > this.rightLimit) {
        this.output(line)
        line = ' '.repeat(usage.length)
      }
      line += ' ' + definition
    }

    // If there is a remaining partial line, output it.
    if (line.length > usage.length) {
      this.output(line)
    }
  }

  /**
   * @summary Output available commands for incomplete invocations.
   *
   * @description
   * Called only if `hasChildrenCommands()`.
   */
  outputAvailableCommands (): void {
    const context: Context = this.context

    assert(context.commandNode)

    // Sorted direct children commands.
    const commands: string[] =
      context.commandNode.getChildrenCommandNames().sort()
    assert(commands.length > 0)

    const commandParts =
      [context.programName, ...context.commandNode.getUnaliasedCommandParts()]
        .join(' ')

    const postOptions =
      context.commandNode.helpDefinitions?.usagePostOptions ?? '[<args>...]'

    this.commands = commands

    this.output(`Usage: ${commandParts} <command> [<subcommand>...]` +
      ` [<options> ...] ${postOptions}`)
    this.output()
    this.output('where <command> is one of:')

    let buffer: string | null = null
    commands.forEach((command, index) => {
      if (buffer === null) {
        buffer = '  '
      }
      buffer += command
      if (index !== (commands.length - 1)) {
        buffer += ', '
      }
      if (buffer.length > this.rightLimit) {
        this.output(buffer)
        buffer = null
      }
    })
    if (buffer != null) {
      this.output(buffer)
      buffer = null
    }
  }

  outputCommandAliases (): void {
    const context: Context = this.context

    assert(context.commandNode)

    if (context.commandNode.aliases.length > 0) {
      this.output()
      this.output('Command aliases: ' +
        `${context.commandNode.aliases.sort().join(', ')}`)
    }
  }

  outputAlignedOptionsGroups (
  ): void {
    const context: Context = this.context

    assert(context.options)

    const options: Options = context.options
    // The common options are processed **after** the command specific options.
    const optionsGroups =
      [...options.groups, ...options.commonGroups]

    optionsGroups.forEach((optionsGroup) => {
      this.outputOptions(
        optionsGroup.optionsDefinitions, optionsGroup.description.trim())
    })
  }

  isOptionDisplayable (helpDefinitions: OptionHelpDefinitions): boolean {
    return (helpDefinitions.description !== undefined &&
      !(helpDefinitions.isRequiredEarly ?? false) &&
      !(helpDefinitions.isHelp ?? false))
  }

  outputOptions (
    optionDefinitions: OptionDefinition[],
    description: string
  ): void {
    const multiPass = this.multiPass

    // Filter options and keep only those with a description, and are
    // **not** marked as isHelp or isRequiredEarly.
    let hasContent = false
    optionDefinitions.forEach((optionDefinition) => {
      const helpDefinitions = optionDefinition.helpDefinitions ?? {}
      if (this.isOptionDisplayable(helpDefinitions)) {
        hasContent = true
      }
    })
    if (!hasContent) {
      return
    }

    if (multiPass.isSecondPass && description.length > 0) {
      this.output()
      this.output(description + ':')
    }

    optionDefinitions.forEach((optionDefinition) => {
      assert(optionDefinition.helpDefinitions)
      const helpDefinitions = optionDefinition.helpDefinitions
      if (this.isOptionDisplayable(helpDefinitions)) {
        // Join all options, in the user order.
        let option = '  ' + optionDefinition.options.join('|')

        // If it has values, possibly add a type, or `s` for string.
        if ((optionDefinition.hasValue ?? false) ||
          (Array.isArray(optionDefinition.values) &&
            optionDefinition.values.length > 0) ||
          helpDefinitions.valueDescription !== undefined) {
          option += ` <${helpDefinitions.valueDescription ?? 's'}>`
        }

        if (multiPass.isFirstPass) {
          if (!(helpDefinitions.isExtraLarge ?? false)) {
            multiPass.updateWidth(option.length)
          }
        } else {
          // If the current line is longer than the middle limit,
          // output it and output the description on the next line.
          if (option.length >= multiPass.limit) {
            this.output(option)
            option = ''
          }

          assert(helpDefinitions.description)
          let description = helpDefinitions.description

          if (Array.isArray(optionDefinition.values) &&
            optionDefinition.values.length > 0) {
            description += ` (${optionDefinition.values.join('|')})`
          }

          const helpDefaultDescription =
            (!(optionDefinition.isMandatory ?? false) &&
              helpDefinitions.defaultValueDescription !== undefined)
              ? `, default ${helpDefinitions.defaultValueDescription}`
              : ''

          if (!(optionDefinition.isMandatory ?? false) &&
            (helpDefinitions.isMultiple ?? false)) {
            description += ` (optional, multiple${helpDefaultDescription})`
          } else if (!(optionDefinition.isMandatory ?? false)) {
            description += ` (optional${helpDefaultDescription})`
          } else if (helpDefinitions.isMultiple ?? false) {
            description += ' (multiple)'
          }

          this.output(
            `${this.padRight(option, multiPass.width)} ${description.trim()}`)
        }
      }
    })
  }

  outputAlignedAllHelpDetails (): void {
    const context: Context = this.context

    assert(context.commandNode)
    const commands: string[] =
      context.commandNode.getChildrenCommandNames()

    const optionsGroups =
      [...context.options.groups, ...context.options.commonGroups]

    if (optionsGroups.length > 0) {
      this.outputSecondPass()

      this.outputAlignedHelpDetails()

      if (commands.length > 0) {
        this.outputAlignedHelpDetails({ isForCommand: true })
      }
    }
  }

  outputAlignedHelpDetails (params: {
    isForCommand?: boolean
  } = {}): void {
    const context: Context = this.context
    const programName = context.programName

    const optionsGroups =
      [...context.options.groups, ...context.options.commonGroups]

    optionsGroups.forEach((optionsGroup) => {
      optionsGroup.optionsDefinitions.forEach((optionDefinition) => {
        const helpDefinitions = optionDefinition.helpDefinitions ?? {}
        if (helpDefinitions.description !== undefined &&
          (helpDefinitions.isHelp ?? false)) {
          assert(optionDefinition.options.length > 0)
          const line = `${programName} ` +
            ((params.isForCommand ?? false) ? '<command> ' : '') +
            `${optionDefinition.options.join('|')}`

          this.outputMultiPassLine({
            line,
            description: (
              helpDefinitions.description +
              ((params.isForCommand ?? false) ? ' for command' : '')
            ),
            skipUpdateWidth: helpDefinitions.isExtraLarge ?? false
          })
        }
      })
    })
  }

  outputAlignedEarlyDetails (): void {
    const context: Context = this.context

    const programName = context.programName
    const optionsGroups =
      [...context.options.groups, ...context.options.commonGroups]

    optionsGroups.forEach((optionsGroup) => {
      optionsGroup.optionsDefinitions.forEach((optionDefinition) => {
        const helpDefinitions = optionDefinition.helpDefinitions ?? {}
        if (helpDefinitions.description !== undefined &&
          (helpDefinitions.isRequiredEarly ?? false)) {
          assert(optionDefinition.options.length > 0)
          const line = `${programName} ${optionDefinition.options.join('|')}`

          this.outputMultiPassLine({
            line,
            description: helpDefinitions.description,
            skipUpdateWidth: helpDefinitions.isExtraLarge ?? false
          })
        }
      })
    })
  }

  outputFooter (): void {
    const context: Context = this.context

    const pkgJson = context.packageJson

    this.output()
    assert(context.rootPath)
    const pkgPath = context.rootPath
    this.output(`npm ${pkgJson.name}@${pkgJson.version} '${pkgPath}'`)

    if (pkgJson.homepage !== undefined) {
      this.output(`Home page: <${pkgJson.homepage}>`)
    }
    const bugReports = 'Bug reports:'
    if (pkgJson.bugs?.url !== undefined) {
      this.output(`${bugReports} <${pkgJson.bugs.url}>`)
    } else if (pkgJson.author !== undefined) {
      if (typeof pkgJson.author === 'object' &&
        pkgJson.author.name !== undefined &&
        pkgJson.author.email !== undefined) {
        this.output(
          `${bugReports} ${pkgJson.author.name} <${pkgJson.author.email}>`)
      } else if (typeof pkgJson.author === 'object' &&
        pkgJson.author.email !== undefined) {
        this.output(
          `${bugReports} <${pkgJson.author.email}>`)
      } else if (typeof pkgJson.author === 'string') {
        this.output(`${bugReports} ${pkgJson.author}`)
      }
    }
  }
}

// ----------------------------------------------------------------------------
