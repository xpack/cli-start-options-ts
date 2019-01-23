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

  constructor (params) {
    assert(params, 'There must be params.')

    assert(params.object)
    this.object = params.object

    assert(params.object.log)
    this.log = params.object.log

    // Validate the values used below.
    assert(params.object.programName)
    // assert(params.object.matchedCommands)
    assert(params.object.package)
    assert(params.object.rootAbsolutePath)

    this.private_ = {}
    this.private_.outputAlways = params.outputAlways

    this.middleLimit = 40
    this.rightLimit = 79 // Do not write in col 80
  }

  output (message = '', ...params) {
    if (this.private_.outputAlways) {
      this.log.always(message, ...params)
    } else {
      this.log.info(message, ...params)
    }
  }

  /**
   * @summary Output the help content.
   * @param {Object} params The generic parameters object.
   * @param {String[]} params.matchedCommands Array of commands; not present
   *  for single commands.
   * @param {CliApplication|CliCommand} params.obj The application or
   *  command object.
   * @param {Object} params.optionsGroups The common option groups
   * @param {String} params.title The application description.
   * @param {Boolean} params.doCommandLine True if called from command.
   * @returns {undefined} Nothing.
   */
  outputAll (params) {
    assert(params)

    this.output()

    this.outputTitle(params.title)

    // Store locally, to be used at the end.
    this.commands = params.matchedCommands || []

    params.obj.doHelpUsage(this)

    // The special trick here is how to align the right column.
    // For this two steps are needed, with the first to compute
    // the max width of the first column, and then to output text.

    this.twoPassAlign(() => {
      params.obj.doHelpWhere(this, this.more)

      const objOptionsGroups = params.obj.optionsGroups ||
        params.obj.constructor.optionsGroups
      if (objOptionsGroups) {
        objOptionsGroups.forEach((optionsGroup) => {
          this.outputOptions(optionsGroup.optionsDefs, optionsGroup.title)
        })
      }

      this.outputOptionsGroups(params.optionsGroups)
      this.outputHelpDetails(params.optionsGroups)
      this.outputEarlyDetails(params.optionsGroups)
    })

    this.outputFooter()
  }

  outputTitle (title) {
    if (title) {
      this.output(`${title}`)
    }
  }

  outputCommandLine (optionsGroups) {
    const programName = this.object.programName

    const usage = `Usage: ${programName} ${this.commands}`
    let str = usage

    if (optionsGroups && (optionsGroups.length > 0) &&
      optionsGroups[0].preOptions) {
      str += ' ' + optionsGroups[0].preOptions
    }
    str += ' [<options>...]'

    if (optionsGroups && (optionsGroups.length > 0) &&
      optionsGroups[0].postOptions) {
      const optStr = optionsGroups[0].postOptions
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
    const programName = this.object.programName

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

  outputEarlyDetails (optionsGroups, more = this.more) {
    const programName = this.object.programName

    if (!more.isFirstPass) {
      // this.output()
    }

    optionsGroups.forEach((optionsGroup) => {
      optionsGroup.optionsDefs.forEach((optionDefs) => {
        const message = optionDefs.message || optionDefs.msg
        if (message && optionDefs.doProcessEarly) {
          let out = `${programName} `
          optionDefs.options.forEach((opt, index) => {
            out += opt
            if (index < (optionDefs.options.length - 1)) {
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

  outputOptionsGroups (optionsGroups, more = this.more) {
    optionsGroups.forEach((optionsGroup) => {
      this.outputOptions(optionsGroup.optionsDefs, optionsGroup.title, more)
    })
  }

  outputOptions (optionsDefs, title, more = this.more) {
    let hasContent = false
    optionsDefs.forEach((optionDefs) => {
      const message = optionDefs.message || optionDefs.msg
      if (message && !optionDefs.doProcessEarly && !optionDefs.isHelp) {
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

    optionsDefs.forEach((optionDefs) => {
      const message = optionDefs.message || optionDefs.msg
      if (message && !optionDefs.doProcessEarly && !optionDefs.isHelp) {
        let strOpts = '  '
        optionDefs.options.forEach((opt, index) => {
          strOpts += opt
          if (index < (optionDefs.options.length - 1)) {
            strOpts += '|'
          }
        })
        if (optionDefs.hasValue || optionDefs.values || optionDefs.param) {
          if (optionDefs.param) {
            strOpts += ` <${optionDefs.param}>`
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
          if (Array.isArray(optionDefs.values)) {
            desc += '('
            optionDefs.values.forEach((value, index) => {
              desc += value
              if (index < (optionDefs.values.length - 1)) {
                desc += '|'
              }
            })
            desc += ') '
          }
          const msgDefault = optionDefs.msgDefault
            ? `, default ${optionDefs.msgDefault}` : ''
          if (optionDefs.isOptional && optionDefs.isMultiple) {
            desc += `(optional, multiple${msgDefault})`
          } else if (optionDefs.isOptional) {
            desc += `(optional${msgDefault})`
          } else if (optionDefs.isMultiple) {
            desc += `(multiple)`
          }
          this.output(`${CliHelp.padRight(strOpts, more.width)} ${desc}`)
        }
      }
    })
  }

  outputFooter () {
    const pkgJson = this.object.package

    this.output()
    const pkgPath = this.object.rootAbsolutePath
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
