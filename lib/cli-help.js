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
 */

// ----------------------------------------------------------------------------

// const path = require('path')

// ============================================================================

// export
class CliHelp {
  // --------------------------------------------------------------------------

  constructor (ctx) {
    this.context = ctx
    this.middleLimit = 40
    this.rightLimit = 79 // Do not write in col 80
  }

  outputCommands (commands) {
    const console = this.context.console
    let pgmName = this.context.pgmName

    // Deep copy & sort
    let cmds = commands.slice()
    cmds.sort()

    const pkgJson = this.context.package

    console.log()
    console.log(`${pkgJson.description}`)
    console.log(`Usage: ${pgmName} <command> [<subcommand>...]` +
      ' [<options> ...] [<args>...]')
    console.log()
    console.log('where <command> is one of')
    let buf = null
    cmds.forEach((cmd, i) => {
      if (buf === null) {
        buf = '  '
      }
      buf += cmd
      if (i !== (cmds.length - 1)) {
        buf += ', '
      }
      if (buf.length > this.rightLimit) {
        console.log(buf)
        buf = null
      }
    })
    if (buf != null) {
      console.log(buf)
      buf = null
    }
  }

  static padRight (str, n) {
    str += ' '.repeat(n)
    return str.substr(0, n)
  }

  outputHelpDetails (options, more = this.more) {
    const console = this.context.console
    const pgmName = this.context.pgmName

    const s1 = `${pgmName} -h|--help`
    const s2 = `${pgmName} <command> -h|--help`
    if (more.isFirstPass) {
      if (s1.length > more.width) {
        more.width = s1.length
      }
      if (s2.length > more.width) {
        more.width = s2.length
      }
    } else {
      console.log()
      console.log(`${CliHelp.padRight(s1, more.width)} Quick help`)
      console.log(`${CliHelp.padRight(s2, more.width)} Quick help on command`)
    }
  }

  outputEarlyDetails (options, more = this.more) {
    const console = this.context.console
    const pgmName = this.context.pgmName

    if (!more.isFirstPass) {
      console.log()
    }

    options.forEach((option) => {
      if (option.msg && option.doProcessEarly) {
        let optStr = `${pgmName} `
        option.options.forEach((opt, index) => {
          optStr += opt
          if (index < (option.options.length - 1)) {
            optStr += '|'
          }
        })
        if (more.isFirstPass) {
          if (optStr.length > more.width) {
            more.width = optStr.length
          }
        } else {
          if (more.width >= more.limit) {
            console.log(optStr)
            optStr = ''
          }
          optStr += ' '.repeat(more.width)
          let desc = ''
          if (option.msg) {
            desc = option.msg + ' '
          }
          console.log(`${CliHelp.padRight(optStr, more.width)} ${desc}`)
        }
      }
    })
  }

  outputCommonOptions (options, more = this.more) {
    this.outputOptions(options, 'Common options', more)
  }

  outputOptions (options, title, more = this.more) {
    const console = this.context.console

    if (!more.isFirstPass) {
      console.log()
      console.log(title + ':')
    }

    options.forEach((option) => {
      if (option.msg && !option.doProcessEarly && !option.isHelp) {
        let strOpts = '  '
        option.options.forEach((opt, index) => {
          strOpts += opt
          if (index < (option.options.length - 1)) {
            strOpts += '|'
          }
        })
        if (option.hasValue || option.values || option.param) {
          if (option.param) {
            strOpts += ` <${option.param}>`
          } else {
            strOpts += ' <s>'
          }
        }

        if (more.isFirstPass) {
          if (strOpts.length > more.width) {
            more.width = strOpts.length
          }
        } else {
          if (more.width >= more.limit) {
            console.log(strOpts)
            strOpts = ''
          }
          strOpts += ' '.repeat(more.width)
          let desc = ''
          if (option.msg.length > 0) {
            desc = option.msg + ' '
          }
          if (Array.isArray(option.values)) {
            desc += '('
            option.values.forEach((value, index) => {
              desc += value
              if (index < (option.values.length - 1)) {
                desc += '|'
              }
            })
            desc += ') '
          }
          if (option.isOptional && option.isMultiple) {
            desc += '(optional, multiple)'
          } else if (option.isOptional) {
            desc += '(optional)'
          } else if (option.isMultiple) {
            desc += '(multiple)'
          }
          console.log(`${CliHelp.padRight(strOpts, more.width)} ${desc}`)
        }
      }
    })
  }

  outputCommandLine (title, xoptions) {
    const console = this.context.console
    const pgmName = this.context.pgmName

    console.log()
    console.log(title)
    const commands = this.context.commands.join(' ')
    const usage = `Usage: ${pgmName} ${commands} `
    let str = usage + '[options...]'

    let options = []
    xoptions.forEach((xo) => {
      options = options.concat(xo.options)
    })
    options.forEach((option) => {
      let optStr = ''
      option.options.forEach((val) => {
        // Assume the longest option is the more readable.
        if (val.length > optStr.length) {
          optStr = val
        }
      })
      if (option.param) {
        optStr += ` <${option.param}>`
      }
      if (!option.isMandatory) {
        optStr = `[${optStr}]`
        if (option.isMultiple) {
          optStr += '*'
        }
      } else if (option.isMultiple) {
        optStr = `[${optStr}]+`
      }

      // console.log(optStr)
      if (str.length + optStr.length + 1 > this.rightLimit) {
        console.log(str)
        str = ' '.repeat(usage.length - 1)
      }
      str += ' ' + optStr
    })
    if (str.length > usage.length) {
      console.log(str)
    }
  }

  outputFooter () {
    const console = this.context.console
    const pkgJson = this.context.package

    // TODO: display package name, version and location
    console.log()
    const pkgPath = this.context.rootPath
    console.log(`npm ${pkgJson.name}@${pkgJson.version} '${pkgPath}'`)
    if (pkgJson.homepage) {
      console.log(`Home page: <${pkgJson.homepage}>`)
    }
    const br = 'Bug reports:'
    if (pkgJson.bugs.url) {
      console.log(`${br} <${pkgJson.bugs.url}>`)
    } else if (pkgJson.author) {
      if (typeof pkgJson.author === 'object') {
        console.log(`${br} ${pkgJson.author.name} <${pkgJson.author.email}>`)
      } else if (typeof pkgJson.author === 'string') {
        console.log(`${br} ${pkgJson.author}`)
      }
    }
  }

  outputMainHelp (cmds, options) {
    this.outputCommands(cmds)

    // The special trick here is how to align the right column.
    // For this two steps are needed, with the first to compute
    // the max width of the first column, and then to output text.

    this.twoPassAlign(() => {
      this.outputCommonOptions(options)
      this.outputHelpDetails(options)
      this.outputEarlyDetails(options)
    })

    this.outputFooter()
  }

  twoPassAlign (f) {
    let more = this.firstPass()
    f()
    this.secondPass(more)
    f()
  }

  firstPass () {
    this.more = {
      isFirstPass: true,
      width: 0,
      limit: this.middleLimit
    }
    return this.more
  }

  secondPass (more = this.more) {
    more.isFirstPass = false
    // One more is implicit, so a total 2 spaces between columns.
    more.width += 1
    if (more.width > more.limit) {
      more.width = more.limit
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
