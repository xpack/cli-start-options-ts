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
    let programName = this.context.programName

    // Deep copy & sort
    let cmds = commands.slice()
    cmds.sort()

    const pkgJson = this.context.package

    console.log()
    console.log(`${pkgJson.description}`)
    console.log(`Usage: ${programName} <command> [<subcommand>...]` +
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
    const programName = this.context.programName

    const s1 = `${programName} -h|--help`
    const s2 = `${programName} <command> -h|--help`
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

  outputEarlyDetails (optionGroups, more = this.more) {
    const console = this.context.console
    const programName = this.context.programName

    if (!more.isFirstPass) {
      console.log()
    }

    optionGroups.forEach((optionGroup) => {
      optionGroup.optionDefs.forEach((optionDef) => {
        if (optionDef.msg && optionDef.doProcessEarly) {
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
            if (more.width >= more.limit) {
              console.log(out)
              out = ''
            }
            out += ' '.repeat(more.width)
            let desc = ''
            if (optionDef.msg) {
              desc = optionDef.msg + ' '
            }
            console.log(`${CliHelp.padRight(out, more.width)} ${desc}`)
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
    const console = this.context.console

    if (!more.isFirstPass) {
      console.log()
      console.log(title + ':')
    }

    optionDefs.forEach((optionDef) => {
      if (optionDef.msg && !optionDef.doProcessEarly && !optionDef.isHelp) {
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
          if (more.width >= more.limit) {
            console.log(strOpts)
            strOpts = ''
          }
          strOpts += ' '.repeat(more.width)
          let desc = ''
          if (optionDef.msg.length > 0) {
            desc = optionDef.msg + ' '
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
          if (optionDef.isOptional && optionDef.isMultiple) {
            desc += '(optional, multiple)'
          } else if (optionDef.isOptional) {
            desc += '(optional)'
          } else if (optionDef.isMultiple) {
            desc += '(multiple)'
          }
          console.log(`${CliHelp.padRight(strOpts, more.width)} ${desc}`)
        }
      }
    })
  }

  outputCommandLine (title, optionGroups) {
    const console = this.context.console
    const programName = this.context.programName

    console.log()
    console.log(title)
    const commands = this.context.fullCommands
    const usage = `Usage: ${programName} ${commands} `
    let str = usage + '[options...]'

    let optionDefs = []
    optionGroups.forEach((optionGroup) => {
      optionDefs = optionDefs.concat(optionGroup.optionDefs)
    })
    optionDefs.forEach((optionDef) => {
      let optStr = ''
      optionDef.options.forEach((val) => {
        // Assume the longest option is the more readable.
        if (val.length > optStr.length) {
          optStr = val
        }
      })
      if (optionDef.param) {
        optStr += ` <${optionDef.param}>`
      }
      if (optionDef.isOptional) {
        optStr = `[${optStr}]`
        if (optionDef.isMultiple) {
          optStr += '*'
        }
      } else if (optionDef.isMultiple) {
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

  outputMainHelp (cmds, optionGroups) {
    this.outputCommands(cmds)

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
