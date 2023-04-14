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

import { Application } from './application.js'
import { Command } from './command.js'
import { Context } from './context.js'
import { Options, OptionDefinition } from './options.js'

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
}

// ----------------------------------------------------------------------------

export class Help {
  // --------------------------------------------------------------------------

  protected context: Context

  public middleLimit: number
  public rightLimit: number
  public commands?: string[]
  public multiPass: MultiPass

  protected isOutputAlways: boolean

  constructor (params: {
    context: Context
    isOutputAlways?: boolean
  }) {
    assert(params)

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

  outputMaybeLongLine (
    line: string,
    description: string
  ): void {
    const multiPass = this.multiPass

    let str: string = line.trim()
    if (str.length >= multiPass.limit) {
      // If the line is longer than the limit, output it
      // alone and move the description to the next line.
      this.output(str)
      str = ''
    }
    this.output(`${this.padRight(str, multiPass.width)} ${description}`)
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
    let str = line.trimEnd() // Do not trim start!
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
  outputAll (params: {
    object: Application | Command
  }): void {
    assert(params)

    const context: Context = this.context

    assert(context.commandNode)
    assert(context.commandNode.helpDefinitions)

    // Start with an empty line.
    this.output()

    this.outputTitle()

    if (context.commandNode.hasChildrenCommands()) {
      this.outputAvailableCommands()
    } else {
      // No further sub-commands, leaves in the commands tree.
      this.outputCommandLine()
      this.outputCommandAliases()
    }

    // The special trick here is how to align the right column.
    // For this two steps are needed, with the first to compute
    // the max width of the first column, and then to output text.

    this.twoPassAlign(() => {
      params.object.outputHelpAlignedOptions({ help: this })

      this.outputOptionsGroups()
      this.outputHelpDetails()
      this.outputEarlyDetails()
    })

    this.outputFooter()
  }

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
      // Choose the longest alias, as the most readable.
      definition = ''
      optionDefinition.options.forEach((option) => {
        if (option.length > definition.length) {
          definition = option
        }
      })

      // Add value description.
      const helpDefinitions = optionDefinition.helpDefinitions ?? {}
      if (optionDefinition.hasValue ?? false) {
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

  padRight (str: string, count: number): string {
    str += ' '.repeat(count)
    return str.substring(0, count)
  }

  outputHelpDetails (
  ): void {
    const context: Context = this.context

    const multiPass = this.multiPass
    const programName: string = context.programName

    const str1: string = `${programName} -h|--help`
    const str2: string = `${programName} <command> -h|--help`
    if (multiPass.isFirstPass) {
      multiPass.updateWidth(str1.length)
      if (this.commands !== undefined) {
        multiPass.updateWidth(str2.length)
      }
    } else {
      this.output()
      this.outputMaybeLongLine(str1, 'Quick help')
      if (this.commands !== undefined) {
        this.outputMaybeLongLine(str2, 'Quick help on command')
      }
    }
  }

  outputMaybeLongLine (
    out: string,
    message: string
  ): void {
    const multiPass = this.multiPass

    if (out.length >= multiPass.limit) {
      this.output(out)
      out = ''
    }
    out += ' '.repeat(multiPass.width)
    let desc: string = ''
    if (message !== undefined) {
      desc = message + ' '
    }
    this.output(`${this.padRight(out, multiPass.width)} ${desc}`)
  }

  outputEarlyDetails (
    multiPass = this.multiPass
  ): void {
    const context: Context = this.context

    const programName = context.programName
    const optionsGroups = context.options.commonGroups

    if (!multiPass.isFirstPass) {
      // log.output()
    }

    optionsGroups.forEach((optionsGroup) => {
      optionsGroup.optionsDefinitions.forEach((optionDefinition) => {
        const helpDefinitions = optionDefinition.helpDefinitions ?? {}
        if (helpDefinitions.description !== undefined &&
          (helpDefinitions.isRequiredEarly ?? false)) {
          let out = `${programName} `
          optionDefinition.options.forEach((opt, index) => {
            out += opt
            if (index < (optionDefinition.options.length - 1)) {
              out += '|'
            }
          })
          if (multiPass.isFirstPass) {
            multiPass.updateWidth(out.length)
          } else {
            this.outputMaybeLongLine(out, helpDefinitions.description)
          }
        }
      })
    })
  }

  outputOptionsGroups (
  ): void {
    const context: Context = this.context

    const options: Options = context.options
    const optionsGroups =
      [...options.groups, ...options.commonGroups]

    optionsGroups.forEach((optionsGroup) => {
      this.outputOptions(
        optionsGroup.optionsDefinitions, optionsGroup.description)
    })
  }

  outputOptions (
    optionDefinitions: OptionDefinition[],
    description: string | undefined
  ): void {
    const multiPass = this.multiPass

    let hasContent = false
    optionDefinitions.forEach((optionDefinition) => {
      const helpDefinitions = optionDefinition.helpDefinitions ?? {}
      if (helpDefinitions.description !== undefined &&
        !(helpDefinitions.isRequiredEarly ?? false) &&
        !(helpDefinitions.isHelp ?? false)) {
        hasContent = true
      }
    })
    if (!hasContent) {
      return
    }

    if (!multiPass.isFirstPass && description !== undefined) {
      this.output()
      this.output(description + ':')
    }

    optionDefinitions.forEach((optionDefinition) => {
      const helpDefinitions = optionDefinition.helpDefinitions ?? {}
      if (helpDefinitions.description !== undefined &&
        !(helpDefinitions.isRequiredEarly ?? false) &&
        !(helpDefinitions.isHelp ?? false)) {
        let strOpts = '  '
        optionDefinition.options.forEach((opt, index) => {
          strOpts += opt
          if (index < (optionDefinition.options.length - 1)) {
            strOpts += '|'
          }
        })
        if ((optionDefinition.hasValue ?? false) ||
          optionDefinition.values !== undefined ||
          helpDefinitions.valueDescription !== undefined) {
          if (helpDefinitions.valueDescription !== undefined) {
            strOpts += ` <${helpDefinitions.valueDescription}>`
          } else {
            strOpts += ' <s>'
          }
        }

        if (multiPass.isFirstPass) {
          multiPass.updateWidth(strOpts.length)
        } else {
          if (strOpts.length >= multiPass.limit) {
            this.output(strOpts)
            strOpts = ''
          }
          strOpts += ' '.repeat(multiPass.width)
          let desc = ''
          if (helpDefinitions.description.length > 0) {
            desc = helpDefinitions.description + ' '
          }
          if (Array.isArray(optionDefinition.values)) {
            desc += '('
            optionDefinition.values.forEach((value, index) => {
              desc += value
              if (optionDefinition.values !== undefined &&
                (index < (optionDefinition.values.length - 1))) {
                desc += '|'
              }
            })
            desc += ') '
          }
          const helpDefaultMessage =
            helpDefinitions.defaultMessage !== undefined
              ? `, default ${helpDefinitions.defaultMessage}`
              : ''
          if (!(optionDefinition.isMandatory ?? false) &&
            (helpDefinitions.isMultiple ?? false)) {
            desc += `(optional, multiple${helpDefaultMessage})`
          } else if (!(optionDefinition.isMandatory ?? false)) {
            desc += `(optional${helpDefaultMessage})`
          } else if (helpDefinitions.isMultiple ?? false) {
            desc += '(multiple)'
          }
          this.output(`${this.padRight(strOpts, multiPass.width)} ${desc}`)
        }
      }
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
