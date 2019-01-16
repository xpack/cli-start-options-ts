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
 * This file provides support to parse the command line arguments.
 *
 * GNU recommended options:
 * - https://www.gnu.org/prep/standards/html_node/Option-Table.html
 * (Every program accepting ‘--silent’ should accept ‘--quiet’ as a synonym.)
 */

/**
 * @callback setOption
 * @param {Object} object Reference to object.
 * @param {Object} value Value to set for the option.
 */

/**
 * @callback initOption
 * @param {Object} object Reference to object.
 */

/**
 * @typedef {Object} OptionDef
 * @property {String[]} options Array of strings matching for the option;
 *  the longest string is displayed in help().
 * @property {String} message Message to display; only options with messages
 *  are displayed in help.
 * @property {setOption} action Mandatory function called to set an
 *  option value.
 * @property {initOption} init Mandatory function called to
 *  initialize an option.
 * @property {Boolean} isHelp True if it defines the option to get help;
 *  not displayed in the common list, but as a separate line.
 * @property {Boolean} doProcessEarly True if the option must be processed
 *  before other options, for example interactive options.
 * @property {Boolean} hasValue True if the option should be followed
 *  by a value
 * @property {String[]} values Array of allowed values; the input is checked
 *  agains this array.
 * @property {String} msgDefault The string to be displayed in help as
 *  default value.
 * @property {String} param String used to represent the value in help,
 *  like `file`, `folder`, etc.
 * @property {Boolean} isOptional True if the option is not mandatory;
 *  in help it'll be displayed surrounded by square brackets.
 * @property {Boolean} isMultiple True if the option may appear several
 *  times; in help it'll be displayed followed by an asterisk.
 */
// ----------------------------------------------------------------------------

const assert = require('assert')
const path = require('path')

// ES6: `import { CliExitCodes } from './cli-error.js'
const CliErrorSyntax = require('./cli-error.js').CliErrorSyntax

// ----------------------------------------------------------------------------

// TODO: support --option=[value]
// TODO: support abbreviations, as long as unique
// (GNU also recommends to support concatenated single letter options)

// ============================================================================

/**
 * @classdesc
 * Internal class used to construct the tree of commands.
 *
 * The tree includes nodes for each character in the commands.
 * Leaves are always a space character.
 */
class Node {
  // --------------------------------------------------------------------------

  /**
   * @summary Add a character to the commands tree.
   *
   * @param {Node} parent The node to add the character as a child.
   * @param {String} chr One char string.
   * @param {String} path Relative path to the file implementing the command.
   * @param {String} className Optional class name exported by the module.
   * @param {String} unaliased Official command name (unaliased).
   * @returns {Node} The new node added to the tree.
   */
  static add (parent, chr, path, className, unaliased) {
    assert(parent !== null, 'Null parent.')

    for (const val of parent.children) {
      if (val.chr === chr) {
        val.count += 1
        val.path = null
        return val
      }
    }

    const node = new Node(chr, path, unaliased)
    node.className = className
    parent.children.push(node)
    return node
  }

  /**
   * @summary Create a tree node to store the character and the children nodes.
   *
   * @param {String} chr One char string.
   * @param {String} path_ Relative path to the file implementing the command.
   * @param {String} unaliased Official command name (unaliased).
   * @returns {Node} The newly created node.
   */
  constructor (chr, path_, unaliased) {
    this.chr = chr ? chr.toLowerCase() : null
    this.count = 1
    this.path = path_
    this.unaliased = unaliased
    this.children = []
  }
}

// ============================================================================

/**
 * @classdesc
 * Manage CLI options and commands. Keep an array of options and a tree
 * of commands.
 */
// export
class CliOptions {
  // --------------------------------------------------------------------------

  /**
   * @summary Static initialiser.
   *
   * @returns {undefined} Nothing.
   *
   * @description
   * Please note the US English spelling.
   */
  constructor () {
    this.cmdFirstArray_ = []
  }

  /**
   * @summary Add commands to the tree.
   *
   * @param {String[]} cmds Array of commands with possible aliases.
   * @param {String} relativePath Path to module that implements the command.
   * @param {String} className Optional class name, in case multiple classes
   *  are defined in the same file; by default the first class exported,
   *
   * @returns {undefined} Nothing.
   *
   * @example
   * // Test with two aliases, one of them being also a shorthand.
   * CliOptions.addCommand(['test', 't', 'tst'], 'lib/xmake/test.js')
   */
  addCommand (cmds, relativePath, className) {
    const cmdsArray = Array.isArray(cmds) ? cmds : [cmds]
    const unaliased = cmdsArray[0].toLowerCase()
    cmdsArray.forEach((cmds, index) => {
      // Be sure the commands are lower case, end with a space, and
      // multiple spaces are collapsed.
      const cmdsCured = (cmds + ' ').toLowerCase().replace(/\s+/, ' ')
      // With empty parameter, split works at character level.
      const arr = cmdsCured.split('')

      if (!this.cmdTree_) {
        this.cmdTree_ = new Node(null, null)
      }

      // Add a node for each character.
      let node = this.cmdTree_
      arr.forEach((val) => {
        node = Node.add(node, val, relativePath, className, unaliased)
      })

      if (index === 0) {
        // Keep a separate array with the first command in each group.
        this.cmdFirstArray_.push(cmdsCured.split(' ')[0])
      }
    })
  }

  /**
   * @summary Define the file to implement the command.
   * @param {String} path Path to module that implements the command.
   *
   * @returns {undefined} Nothing.
   */
  setCommandFile (path) {
    this.moduleRelativePath = path
  }

  /**
   * @summary Add option groups.
   *
   * @param {Object|object[]} optionGroups One or more option groups.
   * @returns {undefined} Nothing.
   *
   * @description
   * Preliminary solution with array instead of tree.
   */
  addOptionGroups (optionGroups) {
    if (!this.commonOptionGroups_) {
      this.commonOptionGroups_ = []
    }
    optionGroups.forEach((od) => {
      this.commonOptionGroups_.push(od)
    })
  }

  appendToOptionGroups (title, optionDefs) {
    this.commonOptionGroups_.forEach((optionGroup) => {
      if (optionGroup.title === title) {
        optionGroup.optionDefs = optionGroup.optionDefs.concat(optionDefs)
      }
    })
  }

  initOptionGroups (optionGroups, object) {
    optionGroups.forEach((optionGroup) => {
      optionGroup.optionDefs.forEach((optionDef) => {
        optionDef.init(object)
        optionDef.wasProcessed = false
      })
    })
  }

  hasCommands () {
    return this.cmdFirstArray_ && (this.cmdFirstArray_.length > 0)
  }

  /**
   * @summary Get array of commands.
   *
   * @returns {String[]} Array of strings with the commands.
   */
  getCommandsFirstArray () {
    return this.cmdFirstArray_
  }

  /**
   * @summary Get array of option groups.
   *
   * @returns {Object[]} Array of option groups.
   */
  getCommonOptionGroups () {
    return this.commonOptionGroups_
  }

  /**
   * @summary Parse options, common and specific to a command.
   *
   * @param {String[]} argv Array of arguments.
   * @param {Object} object Reference to the object object
   * @param {Array} optionGroups Optional reference to command specific options.
   * @returns {String[]} Array of remaining arguments.
   *
   * @description
   * Iterate argv, and try to match all known options.
   *
   * Identified options will add/update properties of a
   * configuration that must exist in the object.
   *
   * Arguments not identified as options are returned, in order.
   */
  parseOptions (argv, object, optionGroups = undefined) {
    assert(object.log, 'Logger not initialised')
    const log = object.log
    log.trace('parseOptions()')

    // In addition to common options, bring together all options from
    // all command option groups, if any.
    let allOptionDefs = []
    if (!optionGroups) {
      this.commonOptionGroups_.forEach((optionGroup) => {
        allOptionDefs = allOptionDefs.concat(optionGroup.optionDefs)
      })
    } else {
      optionGroups.forEach((optionGroup) => {
        allOptionDefs = allOptionDefs.concat(optionGroup.optionDefs)
      })
    }

    allOptionDefs.forEach((optDef) => {
      optDef.wasProcessed = false
      optDef.init(object)
    })

    const remaining = []
    let processed = false
    let i = 0
    for (; i < argv.length; ++i) {
      const arg = argv[i]
      if (arg === '--') {
        break
      }
      processed = false
      if (arg.startsWith('-')) {
        // If it starts with dash, it is an option.
        // Try to find it in the list of known options.
        for (const optionDef of allOptionDefs) {
          const aliases = optionDef.options
          // Iterate all aliases.
          for (const alias of aliases) {
            if (arg === alias) {
              i += this.processOption_(argv, i, optionDef, object)
              processed = true
              break
            }
          }
          if (processed) {
            break
          }
        }
      }
      if (!processed) {
        remaining.push(arg)
      }
    }
    // If the previous look was terminated by a `--`,
    // copy the remaining arguments.
    for (; i < argv.length; ++i) {
      const arg = argv[i]
      remaining.push(arg)
    }

    return remaining
  }

  /**
   * @summary Check if mandatory option is missing.
   *
   * @param {Object[]} optionGroups Array of option groups.
   * @returns {String[]|null} Array of errors or null if everything is ok.
   */
  checkMissing (optionGroups) {
    let allOptionDefs = []
    if (optionGroups) {
      optionGroups.forEach((optionGroup) => {
        allOptionDefs = allOptionDefs.concat(optionGroup.optionDefs)
      })
    }

    let errors = []
    allOptionDefs.forEach((optDef) => {
      if (optDef.isMandatory && !optDef.wasProcessed) {
        let opt = optDef.options.join(' ')
        errors.push(`Mandatory '${opt}' not found`)
      }
    })

    if (errors.length > 0) {
      return errors
    }
    return null
  }

  /**
   * @summary Process an option.
   *
   * @param {String[]} argv All input arguments.
   * @param {number} index Index of the current arg.
   * @param {Object} optionDef Reference to the current option definition.
   * @param {Object} object Reference to the object object, where to
   *  store the configuration values.
   * @returns {number} 1 if the next arg should be skipped.
   *
   * @description
   * Processing the option means calling a function, that most probably
   * will add or update something in the configuration object.
   *
   * If the option has a separate value, it consumes it and informs
   * the caller to skip the next option.
   *
   * @todo process --opt=value syntax.
   */
  processOption_ (argv, index, optionDef, object) {
    // Explicit upper case to know it is a class.
    const arg = argv[index]
    let value = null
    // Values can be only an array, or null.
    // An array means the option takes a value.
    if (optionDef.hasValue || optionDef.param ||
      Array.isArray(optionDef.values)) {
      if (index < (argv.length - 1)) {
        // Not the last option; engulf the next arg.
        value = argv[index + 1]
        // args[index + 1].processed = true
      } else {
        // Error, expected option value not available.
        throw new CliErrorSyntax(`'${arg}' expects a value`)
      }
      if (Array.isArray(optionDef.values)) {
        // If a list of allowed values is present,
        // the option value must be validated.
        for (const allowedValue of optionDef.values) {
          if (value === allowedValue) {
            // If allowed, call the action to set the
            // configuration value
            optionDef.action(object, value)
            optionDef.wasProcessed = true
            return 1
          }
        }
        // Error, illegal option value
        throw new CliErrorSyntax(`Value '${value}' not allowed for '${arg}'`)
      } else {
        // Call the action to set the configuration value
        optionDef.action(object, value)
        optionDef.wasProcessed = true
        return 1
      }
    } else {
      // No list of allowed values defined, call the action
      // to update the configuration.
      optionDef.action(object)
      optionDef.wasProcessed = true
      return 0
    }
  }

  /**
   * @typedef {Object} findCommandClassReturn
   * @property {CmdClass} class
   * @property {String[]} matchedCommands
   * @property {String[]} rest
   * /

  /**
   * @summary Find a class that implements the commands.
   *
   * @param {String[]} cmds The commands, as entered.
   * @param {String} rootAbsolutePath The absolute path of the package.
   * @param {class} cmdClass The base class of all commands.
   * @returns {findCommandClassReturn} An object with a class
   *  that implements the given command,
   *  the full command as a string array, and the remaining arguments.
   * @throws CliErrorSyntax The command was not recognised or
   *  is not unique, or the module does not implement CmdClass.
   *
   * @description
   * Walk down the commands tree and return the first module path encountered.
   * This means when a substring is deemed unique.
   *
   * To get the full command name, continue the walk down to a space.
   *
   * Due to circular references, cannot import CliCommand here,
   * so it must be passed from the caller.
   */
  findCommandClass (cmds, rootAbsolutePath, cmdClass) {
    let matchedCommands = ''
    let modRelPath = null
    let className
    let rest = []
    if (this.moduleRelativePath) {
      modRelPath = this.moduleRelativePath
    } else {
      if ((!this.cmdFirstArray_) || (this.cmdFirstArray_.length === 0) ||
        (this.cmdTree_ === null)) {
        return {
          error: true
        }
      }

      // TODO: walk the tree.
      const str = cmds.join(' ').trim() + ' '

      let node = this.cmdTree_
      const strArr = str.split('')
      matchedCommands = ''
      let ix
      for (ix = 0; ix < strArr.length; ++ix) {
        const chr = strArr[ix]
        matchedCommands += chr
        let found = null
        for (const child of node.children) {
          if (chr === child.chr) {
            found = child
            break
          }
        }
        if (!found) {
          if (chr === ' ') {
            break
          }
          // TODO: suggest unique commands.
          throw new CliErrorSyntax(`Command '${str.trim()}' not supported.`)
        }
        node = found
        if (node.path) {
          modRelPath = node.path
          className = node.className
          matchedCommands = node.unaliased.trim()
          break
        }
      }
      if (!modRelPath) {
        throw new CliErrorSyntax(`Command '${str.trim()}' is not unique.`)
      }
      rest = []
      for (; ix < strArr.length; ++ix) {
        if (strArr[ix] === ' ') {
          if (ix + 1 <= strArr.length - 1) {
            let str = strArr.slice(ix + 1, strArr.length - 1).join('')
            if (str.length > 0) {
              rest = str.split(' ')
            }
          }
          break
        }
      }
    }

    const modPath = path.join(rootAbsolutePath, modRelPath)
    const modex = require(modPath.toString())

    if (className) {
      const obj = modex[className]
      if (obj && cmdClass.isPrototypeOf(obj)) {
        return {
          CmdClass: obj,
          matchedCommands: matchedCommands.split(' '),
          rest: rest
        }
      }
      // Class not found
      assert(false, `A class named ${className} and derived from ` +
        `'${cmdClass.name}' is not defined in '${modPath}'.`)
    } else {
      // Return the first exported class derived from `CliCommand`.
      for (const obj of Object.values(modex)) {
        if (cmdClass.isPrototypeOf(obj)) {
          return {
            CmdClass: obj,
            matchedCommands: matchedCommands.split(' '),
            rest: rest
          }
        }
      }
      // Module not found
      assert(false, `A class derived from '${cmdClass.name}' not ` +
        `found in '${modPath}'.`)
    }
  }

  /**
   * @summary Return argv up to the first `--`.
   *
   * @param {String[]} argv Array of strings.
   * @returns {String[]} Posibly a shorter array.
   */
  filterOwnArguments (argv) {
    const ownArgs = []
    for (const arg of argv) {
      if (arg === '--') {
        break
      }
      ownArgs.push(arg)
    }
    return ownArgs
  }

  /**
   * @summary Return arguments after the first `--`, if any.
   *
   * @param {String[]} argv Array of strings.
   * @returns {String[]} A shorter array, possibly empty.
   */
  filterOtherArguments (argv) {
    const otherArgs = []
    let hasOther = false
    for (const arg of argv) {
      if (hasOther) {
        otherArgs.push(arg)
      } else if (arg === '--') {
        hasOther = true
        continue
      }
    }
    return otherArgs
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The CliOptions class is added as a property of this object.
module.exports.CliOptions = CliOptions

// In ES6, it would be:
// export class CliOptions { ... }
// ...
// import { CliOptions } from 'cli-options.js'

// ----------------------------------------------------------------------------
