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

// https://www.npmjs.com/package/@xpack/logger
import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import { Context } from './context.js'
import { OptionsGroup, OptionDefinition } from './options.js'

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

export class Help {
  // --------------------------------------------------------------------------

  public context: Context
  public middleLimit: number
  public rightLimit: number
  public commands?: string[]
  public multiPass: MultiPass

  constructor (context: Context) {
    this.context = context
    this.middleLimit = 40
    this.rightLimit = 79 // Do not write in col 80

    this.multiPass = new MultiPass(this.middleLimit)
  }

  outputCommands (
    commands: string[] | undefined,
    description: string | undefined,
    message: string = '[<args>...]'
  ): void {
    const log: Logger = this.context.log
    const programName: string = this.context.programName

    log.output()
    if (description === undefined) {
      const packageJson = this.context.packageJson
      description = packageJson.description
    }
    if (description !== undefined) {
      log.output(`${description}`)
    }

    if (commands !== undefined) {
      // Remember for further possible usage.
      this.commands = commands

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
    _optionsGroups: OptionsGroup[], // Unused
    multiPass = this.multiPass
  ): void {
    const log: Logger = this.context.log
    const programName: string = this.context.programName

    const str1: string = `${programName} -h|--help`
    const str2: string = `${programName} <command> -h|--help`
    if (multiPass.isFirstPass) {
      multiPass.updateWidth(str1.length)
      if (this.commands !== undefined) {
        multiPass.updateWidth(str2.length)
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
    const log: Logger = this.context.log
    if (out.length >= multiPass.limit) {
      log.output(out)
      out = ''
    }
    out += ' '.repeat(multiPass.width)
    let desc: string = ''
    if (message !== undefined) {
      desc = message + ' '
    }
    log.output(`${Help.padRight(out, multiPass.width)} ${desc}`)
  }

  outputEarlyDetails (
    optionsGroups: OptionsGroup[],
    multiPass = this.multiPass
  ): void {
    const programName = this.context.programName

    if (!multiPass.isFirstPass) {
      // log.output()
    }

    optionsGroups.forEach((optionsGroup) => {
      optionsGroup.optionsDefinitions.forEach((optionDefinition) => {
        if (optionDefinition.message !== undefined &&
          (optionDefinition.doProcessEarly !== undefined &&
            optionDefinition.doProcessEarly)) {
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
    optionsGroups: OptionsGroup[],
    multiPass = this.multiPass
  ): void {
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
    const log = this.context.log

    let hasContent = false
    optionDefinitions.forEach((optionDefinition) => {
      if (optionDefinition.message !== undefined &&
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

    optionDefinitions.forEach((optionDefinition) => {
      if (optionDefinition.message !== undefined &&
        !(optionDefinition.doProcessEarly !== undefined &&
          optionDefinition.doProcessEarly) &&
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
            log.output(strOpts)
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
          const msgDefault = optionDefinition.msgDefault !== undefined
            ? `, default ${optionDefinition.msgDefault}`
            : ''
          if (optionDefinition.isOptional !== undefined &&
             optionDefinition.isOptional &&
             optionDefinition.isMultiple !== undefined &&
             optionDefinition.isMultiple) {
            desc += `(optional, multiple${msgDefault})`
          } else if (optionDefinition.isOptional !== undefined &&
            optionDefinition.isOptional) {
            desc += `(optional${msgDefault})`
          } else if (optionDefinition.isMultiple !== undefined &&
              optionDefinition.isMultiple) {
            desc += '(multiple)'
          }
          log.output(`${Help.padRight(strOpts, multiPass.width)} ${desc}`)
        }
      }
    })
  }

  outputCommandLine (
    title: string,
    optionsGroups: OptionsGroup[]
  ): void {
    const log = this.context.log
    const programName: string = this.context.programName

    log.output()
    log.output(title)
    const commands = this.context.fullCommands.join(' ')
    const usage = `Usage: ${programName} ${commands}`
    let str: string = usage

    const optionDefinitions: OptionDefinition[] = []
    if (optionsGroups !== undefined && (optionsGroups.length > 0) &&
      optionsGroups[0]?.preOptions !== undefined) {
      str += ' ' + optionsGroups[0].preOptions
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
        log.output(str)
        str = ' '.repeat(usage.length)
      }
      str += ' ' + buffer
    })
    if (optionsGroups !== undefined && (optionsGroups.length > 0) &&
      optionsGroups[0]?.postOptions !== undefined) {
      buffer = optionsGroups[0].postOptions
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
    const log: Logger = this.context.log
    const pkgJson = this.context.packageJson

    log.output()
    assert(this.context.rootPath)
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
