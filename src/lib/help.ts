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

  public context: Context

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

    // Start with an empty line.
    this.output()

    assert(context.commandNode.helpOptions)
    this.outputTitle(context.commandNode.getHelpTitle())

    if (context.commandNode.hasChildrenCommands()) {
      this.outputCommands()
    } else {
      // When called from commands.
      this.outputCommandLine()
    }
    // The special trick here is how to align the right column.
    // For this two steps are needed, with the first to compute
    // the max width of the first column, and then to output text.

    this.twoPassAlign(() => {
      params.object.outputHelpArgsDetails(this.multiPass)

      this.outputAliases()

      this.outputOptionsGroups()
      this.outputHelpDetails()
      this.outputEarlyDetails()
    })

    this.outputFooter()
  }

  outputTitle (title: string | undefined): void {
    if (title !== undefined) {
      this.output(`${title}`)
      this.output()
    }
  }

  outputCommandLine (): void {
    const context: Context = this.context

    assert(context.commandNode)
    const commandParts =
      [context.programName, ...context.commandNode.getUnaliasedCommandParts()]
        .join(' ')

    const usage = `Usage: ${commandParts}`
    let str: string = usage

    const preOptions =
      this.context.commandNode?.helpOptions?.usagePreOptions ?? ''
    const postOptions =
      this.context.commandNode?.helpOptions?.usagePostOptions ?? ''
    const options: Options = context.options
    const optionsGroups = options.groups
    const optionDefinitions: OptionDefinition[] = []
    if (preOptions.length > 0) {
      str += ' ' + preOptions
    }
    str += ' [options...]'
    optionsGroups.forEach((optionsGroup) => {
      optionDefinitions.push(...optionsGroup.optionsDefinitions)
    })
    let buffer: string
    optionDefinitions.forEach((optionDefinition) => {
      buffer = ''
      optionDefinition.options.forEach((val) => {
        // Assume the longest option is the more readable.
        if (val.length > buffer.length) {
          buffer = val
        }
      })
      if (optionDefinition.param !== undefined) {
        buffer += ` <${optionDefinition.param}>`
      } else if (optionDefinition.hasValue !== undefined &&
        optionDefinition.hasValue) {
        buffer += ' <s>'
      }
      if (optionDefinition.isOptional !== undefined &&
        optionDefinition.isOptional) {
        buffer = `[${buffer}]`
        if (optionDefinition.isMultiple !== undefined &&
          optionDefinition.isMultiple) {
          buffer += '*'
        }
      } else if (optionDefinition.isMultiple !== undefined &&
        optionDefinition.isMultiple) {
        buffer = `[${buffer}]+`
      }

      // log.output(optStr)
      if (str.length + buffer.length + 1 > this.rightLimit) {
        this.output(str)
        str = ' '.repeat(usage.length)
      }
      str += ' ' + buffer
    })
    if (postOptions.length > 0) {
      buffer = postOptions
      if (str.length + buffer.length + 1 > this.rightLimit) {
        this.output(str)
        str = ' '.repeat(usage.length)
      }
      str += ' ' + buffer
    }
    if (str.length > usage.length) {
      this.output(str)
    }
  }

  outputCommands (): void {
    const context: Context = this.context

    assert(context.commandNode)
    const commands: string[] =
      context.commandNode.getChildrenCommandNames().sort()

    const commandParts =
      [context.programName, ...context.commandNode.getUnaliasedCommandParts()]
        .join(' ')

    const message = context.commandNode.helpOptions?.usagePostOptions ??
      '[<args>...]'

    if (commands.length > 0) {
      this.commands = commands

      this.output(`Usage: ${commandParts} <command> [<subcommand>...]` +
        ` [<options> ...] ${message}`)
      this.output()
      this.output('where <command> is one of:')
      let buffer: string | null = null
      commands.forEach((cmd, i) => {
        if (buffer === null) {
          buffer = '  '
        }
        buffer += cmd
        if (i !== (commands.length - 1)) {
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
    } else {
      this.output(`Usage: ${commandParts} [<options> ...] ${message}`)
    }
  }

  outputAliases (): void {
    const context: Context = this.context

    if (context.commandNode !== undefined &&
      context.commandNode.aliases.length > 0 &&
      !this.multiPass.isFirstPass) {
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
    multiPass = this.multiPass
  ): void {
    const context: Context = this.context

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
      this.outputMaybeLongLine(str1, 'Quick help', multiPass)
      if (this.commands !== undefined) {
        this.outputMaybeLongLine(str2, 'Quick help on command', multiPass)
      }
    }
  }

  outputMaybeLongLine (
    out: string,
    message: string,
    multiPass = this.multiPass
  ): void {
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
        if (optionDefinition.message !== undefined &&
          (optionDefinition.isRequiredEarly !== undefined &&
            optionDefinition.isRequiredEarly)) {
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
            this.outputMaybeLongLine(out, optionDefinition.message, multiPass)
          }
        }
      })
    })
  }

  outputOptionsGroups (
    multiPass = this.multiPass
  ): void {
    const context: Context = this.context

    const options: Options = context.options
    const optionsGroups =
      [...options.groups, ...options.commonGroups]

    optionsGroups.forEach((optionsGroup) => {
      this.outputOptions(
        optionsGroup.optionsDefinitions, optionsGroup.title, multiPass)
    })
  }

  outputOptions (
    optionDefinitions: OptionDefinition[],
    title: string | undefined,
    multiPass = this.multiPass
  ): void {
    let hasContent = false
    optionDefinitions.forEach((optionDefinition) => {
      if (optionDefinition.message !== undefined &&
        !(optionDefinition.isRequiredEarly !== undefined &&
          optionDefinition.isRequiredEarly) &&
        !(optionDefinition.isHelp !== undefined &&
          optionDefinition.isHelp)) {
        hasContent = true
      }
    })
    if (!hasContent) {
      return
    }

    if (!multiPass.isFirstPass && title !== undefined) {
      this.output()
      this.output(title + ':')
    }

    optionDefinitions.forEach((optionDefinition) => {
      if (optionDefinition.message !== undefined &&
        !(optionDefinition.isRequiredEarly !== undefined &&
          optionDefinition.isRequiredEarly) &&
        !(optionDefinition.isHelp !== undefined &&
          optionDefinition.isHelp)) {
        let strOpts = '  '
        optionDefinition.options.forEach((opt, index) => {
          strOpts += opt
          if (index < (optionDefinition.options.length - 1)) {
            strOpts += '|'
          }
        })
        if ((optionDefinition.hasValue !== undefined &&
          optionDefinition.hasValue) ||
          optionDefinition.values !== undefined ||
          optionDefinition.param !== undefined) {
          if (optionDefinition.param !== undefined) {
            strOpts += ` <${optionDefinition.param}>`
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
          if (optionDefinition.message.length > 0) {
            desc = optionDefinition.message + ' '
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
            optionDefinition.helpDefaultMessage !== undefined
              ? `, default ${optionDefinition.helpDefaultMessage}`
              : ''
          if (optionDefinition.isOptional !== undefined &&
            optionDefinition.isOptional &&
            optionDefinition.isMultiple !== undefined &&
            optionDefinition.isMultiple) {
            desc += `(optional, multiple${helpDefaultMessage})`
          } else if (optionDefinition.isOptional !== undefined &&
            optionDefinition.isOptional) {
            desc += `(optional${helpDefaultMessage})`
          } else if (optionDefinition.isMultiple !== undefined &&
            optionDefinition.isMultiple) {
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

  /**
   * @summary Call the function twice.
   * @param func Function to call.
   * @returns Nothing.
   */
  twoPassAlign (func: CallableNoArgs): void {
    this.multiPass = new MultiPass(this.middleLimit)
    func()
    this.multiPass.secondPass()
    func()
  }
}

// ----------------------------------------------------------------------------
