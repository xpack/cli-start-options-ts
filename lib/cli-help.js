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
    const log = this.context.log
    let programName = this.context.programName

    // Deep copy & sort
    let cmds = commands.slice()
    cmds.sort()

    const pkgJson = this.context.package

    log.always()
    log.always(`${pkgJson.description}`)
    log.always(`Usage: ${programName} <command> [<subcommand>...]` +
      ' [<options> ...] [<args>...]')
    log.always()
    log.always('where <command> is one of:')
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
        log.always(buf)
        buf = null
      }
    })
    if (buf != null) {
      log.always(buf)
      buf = null
    }
  }

  static padRight (str, n) {
    str += ' '.repeat(n)
    return str.substr(0, n)
  }

  outputHelpDetails (options, more = this.more) {
    const log = this.context.log
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
      log.always()
      log.always(`${CliHelp.padRight(s1, more.width)} Quick help`)
      log.always(`${CliHelp.padRight(s2, more.width)} Quick help on command`)
    }
  }

  outputEarlyDetails (optionGroups, more = this.more) {
    const log = this.context.log
    const programName = this.context.programName

    if (!more.isFirstPass) {
      log.always()
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
              log.always(out)
              out = ''
            }
            out += ' '.repeat(more.width)
            let desc = ''
            if (optionDef.msg) {
              desc = optionDef.msg + ' '
            }
            log.always(`${CliHelp.padRight(out, more.width)} ${desc}`)
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
    const log = this.context.log

    if (!more.isFirstPass) {
      log.always()
      log.always(title + ':')
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
            log.always(strOpts)
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
          log.always(`${CliHelp.padRight(strOpts, more.width)} ${desc}`)
        }
      }
    })
  }

  outputCommandLine (title, optionGroups) {
    const log = this.context.log
    const programName = this.context.programName

    log.always()
    log.always(title)
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

      // log.always(optStr)
      if (str.length + optStr.length + 1 > this.rightLimit) {
        log.always(str)
        str = ' '.repeat(usage.length - 1)
      }
      str += ' ' + optStr
    })
    if (str.length > usage.length) {
      log.always(str)
    }
  }

  outputFooter () {
    const log = this.context.log
    const pkgJson = this.context.package

    log.always()
    const pkgPath = this.context.rootPath
    log.always(`npm ${pkgJson.name}@${pkgJson.version} '${pkgPath}'`)
    if (pkgJson.homepage) {
      log.always(`Home page: <${pkgJson.homepage}>`)
    }
    const br = 'Bug reports:'
    if (pkgJson.bugs.url) {
      log.always(`${br} <${pkgJson.bugs.url}>`)
    } else if (pkgJson.author) {
      if (typeof pkgJson.author === 'object') {
        log.always(`${br} ${pkgJson.author.name} <${pkgJson.author.email}>`)
      } else if (typeof pkgJson.author === 'string') {
        log.always(`${br} ${pkgJson.author}`)
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
