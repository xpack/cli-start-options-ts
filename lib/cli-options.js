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
 * @typedef {Object} OptionsGroup
 * @property {String} title The group title to be displayed in help.
 * @property {Boolean} insertInFront Where to insert; optional, default at
 *  the end, but it is recommended to add commands options to the end.
 * @property {OptionsDef[]} Array of options.
 */

/**
 * @typedef {Object} OptionsDef
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
 * @property {String} mandatoryMessage Optional message to be displayed
 *  if the option is missing.
 */
// ----------------------------------------------------------------------------

const assert = require('assert')
// const path = require('path')

// ES6: `import { CliExitCodes } from './cli-error.js'
const CliErrorSyntax = require('./cli-error.js').CliErrorSyntax

// ----------------------------------------------------------------------------

// TODO: support --option=[value]
// TODO: support abbreviations, as long as unique
// (GNU also recommends to support concatenated single letter options)

// ============================================================================

/**
 * @classdesc
 * Manage CLI options and commands. Keep an array of options and a tree
 * of commands.
 */
// export
class CliOptions {
  // --------------------------------------------------------------------------

  constructor (params) {
    this.optionsGroups = []

    if (params && params.optionsGroups) {
      // Make a deep copy.
      for (const optionsGroup of params.optionsGroups) {
        const newOptionsGroup = {
          ...optionsGroup,
          optionsDefs: []
        }
        for (const optionsDef of optionsGroup.optionsDefs) {
          newOptionsGroup.optionsDefs.push({
            ...optionsDef
          })
        }
        this.optionsGroups.push(newOptionsGroup)
      }
    }

    this.private_ = {}
    this.private_.wereProcessed = new Set()
  }

  /**
   * @summary Add option groups.
   *
   * @param {OptionsGroup[]} optionsGroups Array options groups.
   * @returns {undefined} Nothing.
   *
   * @description
   * Appends or prepends either entire groups, or definitions, if the
   * group (identified by the title) already exists.
   */
  addOptionsGroups (optionsGroups) {
    assert(optionsGroups)

    for (const optionsGroup of optionsGroups) {
      assert(optionsGroup.title)
      assert(optionsGroup.optionsDefs)

      const title = optionsGroup.title
      const insertInFront = optionsGroup.insertInFront

      let existingOptionsGroup
      let groupExists = false
      for (existingOptionsGroup of this.optionsGroups) {
        if (existingOptionsGroup.title === title) {
          groupExists = true
          break
        }
      }
      if (!groupExists) {
        // New option group, insert the whole group.
        if (insertInFront) {
          this.optionsGroups = [
            optionsGroup,
            ...this.optionsGroups
          ]
        } else {
          this.optionsGroups.push(optionsGroup)
        }
      } else {
        // Existing group, insert the new definitions.
        if (insertInFront) {
          existingOptionsGroup.optionsDefs = [
            ...optionsGroup.optionsDefs,
            ...existingOptionsGroup.optionsDefs
          ]
        } else {
          existingOptionsGroup.optionsDefs = [
            ...existingOptionsGroup.optionsDefs,
            ...optionsGroup.optionsDefs
          ]
        }
      }
    }
  }

  /**
   * @summary Parse options, common and specific to a command.
   *
   * @param {Object} params The generic parameters object.
   * @param {String[]} params.argv Array of arguments.
   * @param {Object} params.object Reference to the object object
   * @param {Array} params.optionsGroups Optional reference to command
   *  specific options.
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
  parseOptions (params) {
    assert(params)
    assert(params.argv)
    assert(params.object)

    assert(params.object.log)
    const log = params.object.log
    log.trace('parseOptions()')

    const optionsGroups = params.optionsGroups || this.optionsGroups
    const object = params.object

    // In addition to common options, bring together all options from
    // all command option groups, if any.
    const allOptionDefs = []
    optionsGroups.forEach((optionsGroup) => {
      allOptionDefs.push(...optionsGroup.optionsDefs)
    })

    allOptionDefs.forEach((optDef) => {
      optDef.init(object)
    })

    this.private_.wereProcessed = new Set()

    const remaining = []
    let processed = false
    let i = 0
    const argv = params.argv
    for (; i < argv.length; ++i) {
      const arg = argv[i]
      if (arg === '--') {
        break
      }
      processed = false
      if (arg.startsWith('-')) {
        // If it starts with dash, it is an option.
        // Try to find it in the list of known options.
        for (const optionDefs of allOptionDefs) {
          if (optionDefs.options.includes(arg)) {
            i += this.processOption_({
              argv: argv,
              index: i,
              optionDefs: optionDefs,
              object: object
            })
            processed = true
            break
          }
        }
      }
      if (!processed) {
        remaining.push(arg)
      }
    }
    // If the previous loop was terminated by a `--`,
    // copy the remaining arguments.
    remaining.push(...argv.slice(i))

    return remaining
  }

  /**
   * @summary Process an option.
   *
   * @param {Object} params The generic parameters object.
   * @param {String[]} params.argv All input arguments.
   * @param {number} params.index Index of the current arg.
   * @param {Object} params.optionDefs Reference to the current option
   *  definition.
   * @param {Object} params.object Reference to the object object, where to
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
  processOption_ (params) {
    assert(params)
    assert(params.argv)
    assert(params.optionDefs)
    assert(params.object)

    const argv = params.argv
    const index = params.index
    const optionDefs = params.optionDefs
    const object = params.object

    // Explicit upper case to know it is a class.
    const arg = argv[index]
    let value = null
    // Values can be only an array, or null.
    // An array means the option takes a value.
    if (optionDefs.hasValue || optionDefs.param ||
      Array.isArray(optionDefs.values)) {
      if (index < (argv.length - 1)) {
        // Not the last option; engulf the next arg.
        value = argv[index + 1]
        // args[index + 1].processed = true
      } else {
        // Error, expected option value not available.
        throw new CliErrorSyntax(`'${arg}' expects a value`)
      }
      if (Array.isArray(optionDefs.values)) {
        // If a list of allowed values is present,
        // the option value must be validated.
        for (const allowedValue of optionDefs.values) {
          if (value === allowedValue) {
            // If allowed, call the action to set the
            // configuration value
            optionDefs.action(object, value)
            this.private_.wereProcessed.add(optionDefs)
            return 1
          }
        }
        // Error, illegal option value
        throw new CliErrorSyntax(`Value '${value}' not allowed for '${arg}'`)
      } else {
        // Call the action to set the configuration value
        optionDefs.action(object, value)
        this.private_.wereProcessed.add(optionDefs)
        return 1
      }
    } else {
      // No list of allowed values defined, call the action
      // to update the configuration.
      optionDefs.action(object)
      this.private_.wereProcessed.add(optionDefs)
      return 0
    }
  }

  /**
   * @summary Check if mandatory options are missing.
   *
   * @param {Object[]} optionsGroups Array of option groups.
   * @returns {String[]} Array of errors; empty if everything is ok.
   */
  checkMissing (optionsGroups) {
    optionsGroups = optionsGroups || this.optionsGroups

    const errors = []
    optionsGroups.forEach((optionsGroup) => {
      optionsGroup.optionsDefs.forEach((optionDefs) => {
        if (optionDefs.isMandatory &&
          !this.private_.wereProcessed.has(optionDefs)) {
          if (optionDefs.mandatoryMessage) {
            errors.push(optionDefs.mandatoryMessage)
          } else {
            const str = optionDefs.options.join(' ')
            errors.push(`Mandatory '${str}' not found`)
          }
        }
      })
    })

    return errors
  }

  /**
   * @summary Return argv up to the first `--`.
   *
   * @param {String[]} argv Array of strings.
   * @returns {String[]} Posibly a shorter array.
   *
   * @description
   * Does not use instance data.
   */
  filterOwnArguments (argv) {
    assert(argv)

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
   *
   * @description
   * Does not use instance data.
   */
  filterOtherArguments (argv) {
    assert(argv)

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
