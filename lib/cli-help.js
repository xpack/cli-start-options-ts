/*
 * This file is part of the xPack distribution
 *   (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom
 * the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict'
/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * This file provides support for displaying the application and
 * command specific help.
 *
 * According to GNU Coding Standards, it must go to STDOUT.
 * https://www.gnu.org/prep/standards/html_node/_002d_002dhelp.html
 */

// ----------------------------------------------------------------------------

const assert = require('assert')

// ============================================================================

// export
class CliHelp {
  // --------------------------------------------------------------------------

  constructor (args) {
    assert(args, 'There must be args.')

    assert(args.context)
    this.context = args.context

    this.private_ = {}

    assert(args.context.log)
    this.private_.log = this.context.log
    this.private_.outputAlways = args.outputAlways

    this.middleLimit = 40
    this.rightLimit = 79 // Do not write in col 80
  }

  output (message = '', ...args) {
    if (this.private_.outputAlways) {
      this.private_.log.always(message, ...args)
    } else {
      this.private_.log.info(message, ...args)
    }
  }

  /**
   * @summary Output the help content.
   * @param {Object} args The generic arguments object.
   * @param {String[]} args.cmds Array of commands; not present for single
   *  commands.
   * @param {CliApplication|CliCommand} args.obj The application or
   *  command object.
   * @param {Object} args.optionGroups The common option groups
   * @param {String} args.title The application description.
   * @param {Boolean} args.doCommandLine True if called from command.
   * @returns {undefined} Nothing.
   */
  outputAll (args) {
    assert(args)

    this.output()

    this.outputTitle(args.title)

    // Store locally, to be used at the end.
    this.commands = args.cmds || []

    args.obj.doHelpUsage(this)

    // The special trick here is how to align the right column.
    // For this two steps are needed, with the first to compute
    // the max width of the first column, and then to output text.

    this.twoPassAlign(() => {
      args.obj.doHelpWhere(this, this.more)

      const objOptionGroups = args.obj.optionGroups ||
        args.obj.constructor.optionGroups
      if (objOptionGroups) {
        objOptionGroups.forEach((optionGroup) => {
          this.outputOptions(optionGroup.optionDefs, optionGroup.title)
        })
      }

      this.outputOptionGroups(args.optionGroups)
      this.outputHelpDetails(args.optionGroups)
      this.outputEarlyDetails(args.optionGroups)
    })

    this.outputFooter()
  }

  outputTitle (title) {
    if (title) {
      this.output(`${title}`)
    }
  }

  outputCommandLine (optionGroups) {
    const programName = this.context.programName

    const commands = this.context.fullCommands
    const usage = `Usage: ${programName} ${commands}`
    let str = usage

    if (optionGroups && (optionGroups.length > 0) &&
      optionGroups[0].preOptions) {
      str += ' ' + optionGroups[0].preOptions
    }
    str += ' [<options>...]'

    if (optionGroups && (optionGroups.length > 0) &&
      optionGroups[0].postOptions) {
      const optStr = optionGroups[0].postOptions
      if (str.length + optStr.length + 1 > this.rightLimit) {
        this.output(str)
        str = ' '.repeat(usage.length)
      }
      str += ' ' + optStr
    }
    if (str.length > usage.length) {
      this.output(str)
    }
  }

  static padRight (str, n) {
    str += ' '.repeat(n)
    return str.substr(0, n)
  }

  outputHelpDetails (options, more = this.more) {
    const programName = this.context.programName

    const s1 = `${programName} -h|--help`
    let commandName =
      this.commands.length === 1 ? this.commands[0] : 'command'
    let s2
    if (this.commands.length === 1) {
      s2 = `${programName} ${commandName} -h|--help`
    } else {
      s2 = `${programName} <command> -h|--help`
    }
    if (more.isFirstPass) {
      if (s1.length > more.width) {
        more.width = s1.length
      }
      if (this.commands) {
        if (s2.length > more.width) {
          more.width = s2.length
        }
      }
    } else {
      this.output()
      this.outputMaybeLongLine(s1, 'Quick help', more)
      if (this.commands) {
        if (this.commands.length === 1) {
          this.outputMaybeLongLine(s2, `Quick '${commandName}' help`, more)
        } else {
          this.outputMaybeLongLine(s2, 'Quick help on <command>', more)
        }
      }
    }
  }

  outputMaybeLongLine (out, message, more = this.more) {
    if (out.length >= more.middleLimit) {
      this.output(out)
      out = ''
    }
    out += ' '.repeat(more.width)
    let desc = ''
    if (message) {
      desc = message + ' '
    }
    this.output(`${CliHelp.padRight(out, more.width)} ${desc}`)
  }

  outputEarlyDetails (optionGroups, more = this.more) {
    const programName = this.context.programName

    if (!more.isFirstPass) {
      // this.output()
    }

    optionGroups.forEach((optionGroup) => {
      optionGroup.optionDefs.forEach((optionDef) => {
        const message = optionDef.message || optionDef.msg
        if (message && optionDef.doProcessEarly) {
          let out = `${programName} `
          optionDef.options.forEach((opt, index) => {
            out += opt
            if (index < (optionDef.options.length - 1)) {
              out += '|'
            }
          })
          if (more.isFirstPass) {
            if (out.length > more.width) {
              more.width = out.length
            }
          } else {
            this.outputMaybeLongLine(out, message, more)
          }
        }
      })
    })
  }

  outputOptionGroups (optionGroups, more = this.more) {
    optionGroups.forEach((optionGroup) => {
      this.outputOptions(optionGroup.optionDefs, optionGroup.title, more)
    })
  }

  outputOptions (optionDefs, title, more = this.more) {
    let hasContent = false
    optionDefs.forEach((optionDef) => {
      const message = optionDef.message || optionDef.msg
      if (message && !optionDef.doProcessEarly && !optionDef.isHelp) {
        hasContent = true
      }
    })
    if (!hasContent) {
      return
    }

    if (!more.isFirstPass && title) {
      this.output()
      this.output(title + ':')
    }

    optionDefs.forEach((optionDef) => {
      const message = optionDef.message || optionDef.msg
      if (message && !optionDef.doProcessEarly && !optionDef.isHelp) {
        let strOpts = '  '
        optionDef.options.forEach((opt, index) => {
          strOpts += opt
          if (index < (optionDef.options.length - 1)) {
            strOpts += '|'
          }
        })
        if (optionDef.hasValue || optionDef.values || optionDef.param) {
          if (optionDef.param) {
            strOpts += ` <${optionDef.param}>`
          } else {
            strOpts += ' <s>'
          }
        }

        if (more.isFirstPass) {
          if (strOpts.length > more.width) {
            more.width = strOpts.length
          }
        } else {
          if (strOpts.length >= more.middleLimit) {
            this.output(strOpts)
            strOpts = ''
          }
          strOpts += ' '.repeat(more.width)
          let desc = ''
          if (message.length > 0) {
            desc = message + ' '
          }
          if (Array.isArray(optionDef.values)) {
            desc += '('
            optionDef.values.forEach((value, index) => {
              desc += value
              if (index < (optionDef.values.length - 1)) {
                desc += '|'
              }
            })
            desc += ') '
          }
          const msgDefault = optionDef.msgDefault
            ? `, default ${optionDef.msgDefault}` : ''
          if (optionDef.isOptional && optionDef.isMultiple) {
            desc += `(optional, multiple${msgDefault})`
          } else if (optionDef.isOptional) {
            desc += `(optional${msgDefault})`
          } else if (optionDef.isMultiple) {
            desc += `(multiple)`
          }
          this.output(`${CliHelp.padRight(strOpts, more.width)} ${desc}`)
        }
      }
    })
  }

  outputFooter () {
    const pkgJson = this.context.package

    this.output()
    const pkgPath = this.context.rootPath
    this.output(`npm ${pkgJson.name}@${pkgJson.version} '${pkgPath}'`)
    if (pkgJson.homepage) {
      this.output(`Home page: <${pkgJson.homepage}>`)
    }
    const br = 'Bug reports:'
    if (pkgJson.bugs && pkgJson.bugs.url) {
      this.output(`${br} <${pkgJson.bugs.url}>`)
    } else if (pkgJson.author) {
      if (typeof pkgJson.author === 'object') {
        this.output(`${br} ${pkgJson.author.name} <${pkgJson.author.email}>`)
      } else if (typeof pkgJson.author === 'string') {
        this.output(`${br} ${pkgJson.author}`)
      }
    }
  }

  /**
   * @summary Call the function twice.
   * @param {Function} func Function to call.
   * @returns {undefined} Nothing.
   */
  twoPassAlign (func) {
    let more = this.firstPass()
    func()
    this.secondPass(more)
    func()
  }

  firstPass () {
    this.more = {
      isFirstPass: true,
      width: 0,
      middleLimit: this.middleLimit,
      rightLimit: this.rightLimit
    }
    return this.more
  }

  secondPass (more = this.more) {
    more.isFirstPass = false
    // One more is implicit, so a total 2 spaces between columns.
    more.width += 1
    if (more.width > more.middleLimit) {
      more.width = more.middleLimit
    }
    return more
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The CliHelp class is added as a property of this object.
module.exports.CliHelp = CliHelp

// In ES6, it would be:
// export class CliHelp { ... }
// ...
// import { CliHelp } from 'cli-help.js'

// ----------------------------------------------------------------------------
