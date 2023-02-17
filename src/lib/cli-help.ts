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

import { CliContext } from './cli-context.js'
import { CliLogger } from './cli-logger.js'
import { CliOptionGroup, CliOptionDefinition } from './cli-options.js'

// ----------------------------------------------------------------------------

/*
 * This file provides support for displaying the application and
 * command specific help.
 */

// ============================================================================

type CallableNoArgs = () => void

export class CliMultiPass {
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

export class CliHelp {
  // --------------------------------------------------------------------------

  public context: CliContext
  public middleLimit: number
  public rightLimit: number
  public commands?: string[]
  public multiPass: CliMultiPass

  constructor (context: CliContext) {
    this.context = context
    this.middleLimit = 40
    this.rightLimit = 79 // Do not write in col 80

    this.multiPass = new CliMultiPass(this.middleLimit)
  }

  outputCommands (
    commands: string[] | undefined,
    description: string | undefined,
    message: string = '[<args>...]'
  ): void {
    const log: CliLogger = this.context.log
    const programName: string = this.context.programName

    log.output()
    if (description === undefined) {
      const packageJson = this.context.package
      description = packageJson.description
    }
    if (description !== undefined) {
      log.output(`${description}`)
    }

    // Remember for further possible usage.
    this.commands = commands
    if (commands !== undefined) {
      // Use slice() to do a deep copy & sort.
      const commandsCopy: string[] = commands.slice()
      commandsCopy.sort()

      log.output(`Usage: ${programName} <command> [<subcommand>...]` +
        ` [<options> ...] ${message}`)
      log.output()
      log.output('where <command> is one of:')
      let buffer: string | null = null
      commandsCopy.forEach((cmd, i) => {
        if (buffer === null) {
          buffer = '  '
        }
        buffer += cmd
        if (i !== (commandsCopy.length - 1)) {
          buffer += ', '
        }
        if (buffer.length > this.rightLimit) {
          log.output(buffer)
          buffer = null
        }
      })
      if (buffer != null) {
        log.output(buffer)
        buffer = null
      }
    } else {
      log.output(`Usage: ${programName} ` + ` [<options> ...] ${message}`)
    }
  }

  static padRight (str: string, count: number): string {
    str += ' '.repeat(count)
    return str.substring(0, count)
  }

  outputHelpDetails (
    _optionGroups: CliOptionGroup[], // Unused
    multiPass = this.multiPass
  ): void {
    const log: CliLogger = this.context.log
    const programName: string = this.context.programName

    const str1: string = `${programName} -h|--help`
    const str2: string = `${programName} <command> -h|--help`
    if (multiPass.isFirstPass) {
      if (str1.length > multiPass.width) {
        multiPass.width = str1.length
      }
      if (this.commands !== undefined) {
        if (str2.length > multiPass.width) {
          multiPass.width = str2.length
        }
      }
    } else {
      log.output()
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
    const log: CliLogger = this.context.log
    if (out.length >= multiPass.limit) {
      log.output(out)
      out = ''
    }
    out += ' '.repeat(multiPass.width)
    let desc: string = ''
    if (message !== undefined) {
      desc = message + ' '
    }
    log.output(`${CliHelp.padRight(out, multiPass.width)} ${desc}`)
  }

  outputEarlyDetails (
    optionGroups: CliOptionGroup[],
    multiPass = this.multiPass
  ): void {
    const programName = this.context.programName

    if (!multiPass.isFirstPass) {
      // log.output()
    }

    optionGroups.forEach((optionGroup) => {
      optionGroup.optionDefs.forEach((optionDef) => {
        if (optionDef.msg !== undefined &&
          (optionDef.doProcessEarly !== undefined &&
            optionDef.doProcessEarly)) {
          let out = `${programName} `
          optionDef.options.forEach((opt, index) => {
            out += opt
            if (index < (optionDef.options.length - 1)) {
              out += '|'
            }
          })
          if (multiPass.isFirstPass) {
            if (out.length > multiPass.width) {
              multiPass.width = out.length
            }
          } else {
            this.outputMaybeLongLine(out, optionDef.msg, multiPass)
          }
        }
      })
    })
  }

  outputOptionGroups (
    optionGroups: CliOptionGroup[],
    multiPass = this.multiPass
  ): void {
    optionGroups.forEach((optionGroup) => {
      this.outputOptions(optionGroup.optionDefs, optionGroup.title, multiPass)
    })
  }

  outputOptions (
    optionDefinitions: CliOptionDefinition[],
    title: string | undefined,
    multiPass = this.multiPass
  ): void {
    const log = this.context.log

    let hasContent = false
    optionDefinitions.forEach((optionDefinition) => {
      if (optionDefinition.msg !== undefined &&
        !(optionDefinition.doProcessEarly !== undefined &&
          optionDefinition.doProcessEarly) &&
        !(optionDefinition.isHelp !== undefined &&
          optionDefinition.isHelp)) {
        hasContent = true
      }
    })
    if (!hasContent) {
      return
    }

    if (!multiPass.isFirstPass && title !== undefined) {
      log.output()
      log.output(title + ':')
    }

    optionDefinitions.forEach((optionDef) => {
      if (optionDef.msg !== undefined &&
        !(optionDef.doProcessEarly !== undefined && optionDef.doProcessEarly) &&
        !(optionDef.isHelp !== undefined && optionDef.isHelp)) {
        let strOpts = '  '
        optionDef.options.forEach((opt, index) => {
          strOpts += opt
          if (index < (optionDef.options.length - 1)) {
            strOpts += '|'
          }
        })
        if ((optionDef.hasValue !== undefined && optionDef.hasValue) ||
          optionDef.values !== undefined ||
          optionDef.param !== undefined) {
          if (optionDef.param !== undefined) {
            strOpts += ` <${optionDef.param}>`
          } else {
            strOpts += ' <s>'
          }
        }

        if (multiPass.isFirstPass) {
          if (strOpts.length > multiPass.width) {
            multiPass.width = strOpts.length
          }
        } else {
          if (strOpts.length >= multiPass.limit) {
            log.output(strOpts)
            strOpts = ''
          }
          strOpts += ' '.repeat(multiPass.width)
          let desc = ''
          if (optionDef.msg.length > 0) {
            desc = optionDef.msg + ' '
          }
          if (Array.isArray(optionDef.values)) {
            desc += '('
            optionDef.values.forEach((value, index) => {
              desc += value
              if (optionDef.values !== undefined &&
                (index < (optionDef.values.length - 1))) {
                desc += '|'
              }
            })
            desc += ') '
          }
          const msgDefault = optionDef.msgDefault !== undefined
            ? `, default ${optionDef.msgDefault}`
            : ''
          if (optionDef.isOptional !== undefined &&
             optionDef.isOptional &&
             optionDef.isMultiple !== undefined &&
             optionDef.isMultiple) {
            desc += `(optional, multiple${msgDefault})`
          } else if (optionDef.isOptional !== undefined &&
            optionDef.isOptional) {
            desc += `(optional${msgDefault})`
          } else if (optionDef.isMultiple !== undefined &&
              optionDef.isMultiple) {
            desc += '(multiple)'
          }
          log.output(`${CliHelp.padRight(strOpts, multiPass.width)} ${desc}`)
        }
      }
    })
  }

  outputCommandLine (
    title: string,
    optionGroups: CliOptionGroup[]
  ): void {
    const log = this.context.log
    const programName: string = this.context.programName

    log.output()
    log.output(title)
    const commands = this.context.fullCommands.join(' ')
    const usage = `Usage: ${programName} ${commands}`
    let str: string = usage

    let optionDefs: CliOptionDefinition[] = []
    if (optionGroups !== undefined && (optionGroups.length > 0) &&
      optionGroups[0].preOptions !== undefined) {
      str += ' ' + optionGroups[0].preOptions
    }
    str += ' [options...]'
    optionGroups.forEach((optionGroup) => {
      optionDefs = optionDefs.concat(optionGroup.optionDefs)
    })
    let buffer: string
    optionDefs.forEach((optionDef) => {
      buffer = ''
      optionDef.options.forEach((val) => {
        // Assume the longest option is the more readable.
        if (val.length > buffer.length) {
          buffer = val
        }
      })
      if (optionDef.param !== undefined) {
        buffer += ` <${optionDef.param}>`
      } else if (optionDef.hasValue !== undefined && optionDef.hasValue) {
        buffer += ' <s>'
      }
      if (optionDef.isOptional !== undefined && optionDef.isOptional) {
        buffer = `[${buffer}]`
        if (optionDef.isMultiple !== undefined && optionDef.isMultiple) {
          buffer += '*'
        }
      } else if (optionDef.isMultiple !== undefined && optionDef.isMultiple) {
        buffer = `[${buffer}]+`
      }

      // log.output(optStr)
      if (str.length + buffer.length + 1 > this.rightLimit) {
        log.output(str)
        str = ' '.repeat(usage.length)
      }
      str += ' ' + buffer
    })
    if (optionGroups !== undefined && (optionGroups.length > 0) &&
      optionGroups[0].postOptions !== undefined) {
      buffer = optionGroups[0].postOptions
      if (str.length + buffer.length + 1 > this.rightLimit) {
        log.output(str)
        str = ' '.repeat(usage.length)
      }
      str += ' ' + buffer
    }
    if (str.length > usage.length) {
      log.output(str)
    }
  }

  outputFooter (): void {
    const log: CliLogger = this.context.log
    const pkgJson = this.context.package

    log.output()
    const pkgPath = this.context.rootPath
    log.output(`npm ${pkgJson.name}@${pkgJson.version} '${pkgPath}'`)
    if (pkgJson.homepage !== undefined) {
      log.output(`Home page: <${pkgJson.homepage}>`)
    }
    const bugReports = 'Bug reports:'
    if (pkgJson.bugs?.url !== undefined) {
      log.output(`${bugReports} <${pkgJson.bugs.url}>`)
    } else if (pkgJson.author !== undefined) {
      if (typeof pkgJson.author === 'object' &&
          pkgJson.author.name !== undefined &&
          pkgJson.author.email !== undefined) {
        log.output(
          `${bugReports} ${pkgJson.author.name} <${pkgJson.author.email}>`)
      } else if (typeof pkgJson.author === 'object' &&
          pkgJson.author.email !== undefined) {
        log.output(
          `${bugReports} <${pkgJson.author.email}>`)
      } else if (typeof pkgJson.author === 'string') {
        log.output(`${bugReports} ${pkgJson.author}`)
      }
    }
  }

  outputMainHelp (
    commands: string[] | undefined,
    optionGroups: CliOptionGroup[],
    description?: string
  ): void {
    // Try to get a message from the first group.
    this.outputCommands(commands, description, optionGroups[0].title)

    // The special trick here is how to align the right column.
    // For this two steps are needed, with the first to compute
    // the max width of the first column, and then to output text.

    this.twoPassAlign(() => {
      this.outputOptionGroups(optionGroups)
      this.outputHelpDetails(optionGroups)
      this.outputEarlyDetails(optionGroups)
    })

    this.outputFooter()
  }

  twoPassAlign (f: CallableNoArgs): void {
    this.multiPass = new CliMultiPass(this.middleLimit)
    f()
    this.multiPass.secondPass()
    f()
  }
}

// ----------------------------------------------------------------------------
