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
 * This file provides the base class for application commands.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')
const util = require('util')
const path = require('path')

const CliHelp = require('./cli-help').CliHelp
const CliExitCodes = require('./cli-error.js').CliExitCodes
const Logger = require('@xpack/logger').Logger
const CliOptions = require('./cli-options.js').CliOptions

const CliUtils = require('./cli-utils.js').CliUtils
const CmdsTree = require('./dm-commands.js').CmdsTree

// ============================================================================

/**
 * @typedef {Object} CliCommand instance.
 * @property {Console} console
 * @property {Logger} log
 * @property {String} programName
 * @property {String} processCwd
 * @property {String[]} processArgv Array of process arguments.
 * @property {String[]} processEnv Array of environment variables.
 * @property {String} package
 * @property {String} rootAbsolutePath
 * @property {Object} config
 * @property {String[]} matchedCommands
 * @property {CliOptions} cliOptions
 * @property {CmdsTree} cmdsTree
 * @property {Date} startTime
 */

/**
 * @classdesc
 * Base class for all CLI commands.
 */
// export
class CliCommand {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a command instance.
   *
   * @param {Object} params The generic parameters object or another instance.
   */
  constructor (params) {
    assert(params)

    assert(params.console)
    this.console = params.console

    this.log = params.log || new Logger({
      console: params.console
    })

    const log = this.log
    log.trace(`${this.constructor.name}.constructor()`)

    assert(params.programName)
    this.programName = params.programName

    assert(params.processCwd || params.cwd)
    this.processCwd = params.processCwd || params.cwd

    assert(params.processArgv || params.argv)
    this.processArgv = params.processArgv || params.argv

    assert(params.processEnv || params.env)
    this.processEnv = params.processEnv || params.env

    if (params.package) {
      this.package = params.package
    }

    if (params.rootAbsolutePath) {
      this.rootAbsolutePath = params.rootAbsolutePath
    }

    // Member variables with defaults.
    this.config = params.config || {}
    this.cmdsTree = params.cmdsTree || new CmdsTree()
    if (params.cmdNode) {
      this.cmdNode = params.cmdNode
    } else {
      this.cmdNode = this.cmdsTree
    }
    this.matchedCommands = params.matchedCommands || []

    // Make either a copy of the options, or a brand new instance.
    this.cliOptions = new CliOptions({
      log: log,
      object: this,
      ...params.cliOptions
    })

    this.startTime = params.startTime || Date.now()

    this.private_ = {}
    this.private_.params = params
  }

  /**
   * @summary Execute the command.
   *
   * @param {String[]} argv Array of arguments.
   * @returns {Number} Return code.
   */
  async run (argv) {
    const log = this.log
    log.trace(`${this.constructor.name}.run()`)

    // Not used here, but offered to the implementation.
    assert(this.package)

    assert(this.helpTitle, `The ${this.constructor.name}.constructor() ` +
      'must include a non empty this.helpTitle definition.')

    // Commands must always have at least a single string as command.
    assert(this.matchedCommands)
    assert(this.matchedCommands.length > 0)
    assert(this.cmdNode)

    const remaining =
      this.cliOptions.parseOptions({
        argv: argv,
        object: this
      })

    const config = this.config
    log.trace(util.inspect(config))

    if (config.isHelpRequest) {
      this.help({
        outputAlways: true
      })
      return CliExitCodes.SUCCESS // Ok, command help explicitly called.
    }

    const missing = this.cliOptions.checkMissing()
    if (missing.length > 0) {
      missing.forEach((msg) => {
        log.error(msg)
      })
      this.help()
      return CliExitCodes.ERROR.SYNTAX // Error, missing mandatory option.
    }

    // Check if there are more unrecognised options and log them as warnings.
    if (remaining.length) {
      let i = 0
      for (; i < remaining.length; ++i) {
        const arg = remaining[i]
        if (arg === '--') {
          break
        }
        if (arg.startsWith('-')) {
          log.warn(`Option '${arg}' not supported; ignored`)
        }
      }
    }

    // Finally call the implementation to do the real work.
    // It is recommended to call `this.outputDoneDuration()`
    // before returning.
    const code = await this.doRun(remaining)
    return code
  }

  /**
   * @summary Abstract `doRun()` method.
   *
   * @param {String[]} argv Array of arguments.
   * @returns {Number} Return code.
   *
   * @override
   */
  async doRun (argv) {
    assert(false,
      `Abstract ${this.constructor.name}.doRun(),` +
      ' redefine it in your derived class.')
  }

  /**
   * @summary Output command or application help.
   *
   * @param {Object} params The generic parameters object.
   * @param {Boolean} outputAlways True if help must always output,
   *  regardless of the log level.
   * @returns {undefined} Nothing.
   *
   * @description
   * Override it in the application if custom content is desired.
   *
   * @override
   */
  help (params = {}) {
    const log = this.log
    log.trace(`${this.constructor.name}.help()`)

    const helper = new CliHelp({
      object: this,
      outputAlways: params.outputAlways
    })

    this.helpOutputAll_(helper)
  }

  /**
   * @summary Output the help content.
   * @param {CliHelp} helper The helper object.
   * @returns {undefined} Nothing.
   */
  helpOutputAll_ (helper) {
    assert(helper)

    helper.output()
    assert(this.helpTitle)
    helper.outputTitle(this.helpTitle)

    this.doHelpUsage(helper)

    // The special trick here is how to align the right column.
    // This requires two steps, the first to compute the max width
    // of the first column, and the second to output text.

    const optionsGroups = this.cliOptions.optionsGroups
    assert(optionsGroups)

    helper.twoPassAlign(() => {
      this.doHelpWhere(helper, helper.more)

      helper.outputOptionsGroups(optionsGroups)
      helper.outputHelpDetails(optionsGroups)
      helper.outputEarlyDetails(optionsGroups)
    })

    helper.outputFooter()
  }

  /**
   * @summary Output the usage line.
   *
   * @param {CliHelp} helper Reference to a helper object.
   * @returns {undefined} Nothing.
   *
   * @description
   * The default code outputs a generic '<options>...', followed by
   * some dots; this should work for mos cases, but is not very helpful.
   *
   * If the command has more specific option definitions, for example
   * the file names, paths, etc, redefine this and replace the final
   * dots with the explicit definitions.
   *
   * @override
   */
  doHelpUsage (helper) {
    let usage
    usage = `Usage: ${this.programName}`

    if (this.matchedCommands.length > 0) {
      usage += ` ${this.matchedCommands.join(' ')}`
    }

    if (this.cmdNode.hasCommands()) {
      usage += ' <command>'
      // doHelpWhere() must list the commands.
    }

    usage += ' [<options>...] ...'

    helper.output(usage)
  }

  /**
   * @summary Output the 'where' details.
   *
   * @param {CLiHelp} helper Reference to a helper object.
   * @param {Object} more Object used to handle the two pass processing.
   * @returns {undefined} Nothing.
   *
   * @description
   * If the usage is redefined to add explicit definitions, they can be
   * further explained in a custom 'where' section.
   *
   * @override
   */
  doHelpWhere (helper, more) {
    if (this.cmdNode.hasCommands()) {
      if (!more.isFirstPass) {
        helper.output()
        helper.output('where <command> is one of:')

        const cmds = this.cmdNode.getCommandsNames()
        helper.outputCommandsList(cmds, more)
      }
    }
  }

  /**
   * @summary Display the completed command and the durations.
   *
   * @returns {undefined} Nothing.
   */
  outputDoneDuration () {
    const log = this.log

    log.info()
    const durationString =
      CliUtils.formatDuration(Date.now() - this.startTime)
    const cmdDisplay = [this.programName, ...this.matchedCommands].join(' ')
    log.info(`'${cmdDisplay}' completed in ${durationString}.`)
  }

  /**
   * @summary Make a path absolute.
   *
   * @param {String} inPath A file or folder path.
   * @returns {String} The absolute path.
   *
   * @description
   * If the path is already absolute, resolve it and return.
   * Otherwise, use the configuration CWD or the process CWD to
   * make the path absolute, resolve it and return.
   * To 'resolve' means to process possible `.` or `..` segments.
   */
  makePathAbsolute (inPath) {
    if (path.isAbsolute(inPath)) {
      return path.resolve(inPath)
    }
    return path.resolve(this.config.cwd || this.processCwd, inPath)
  }

  /**
   * @Summary Add a generator record to the destination object.
   *
   * @param {Object} obj The destination object.
   * @param {String[]} argv Array of arguments.
   * @returns {Object} The same object.
   *
   * @description
   * For traceability purposes, the command line used to invoke the
   * program is copied to the object, which will usually serialised
   * into a JSON.
   * Multiple generators are possible, each call will append a new
   * element to the array.
   */
  addGenerator (obj, argv) {
    if (!obj.generators) {
      const generators = []
      obj.generators = generators
    }

    const generator = {}
    generator.tool = this.programName
    generator.version = this.package.version
    generator.command =
      [this.programName, ...this.matchedCommands, ...argv]

    if (this.package.homepage) {
      generator.homepage = this.package.homepage
    }
    generator.date = (new Date()).toISOString()

    obj.generators.push(generator)

    return obj
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The CliCommand class is added as a property of this object.
module.exports.CliCommand = CliCommand

// In ES6, it would be:
// export class CliCommand { ... }
// ...
// import { CliCommand } from 'cli-command.js'

// ----------------------------------------------------------------------------
