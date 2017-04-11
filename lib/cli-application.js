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
 * This file implements the CLI startup code. It prepares a context
 * and calls the module code.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')
const path = require('path')
const fs = require('fs')

// Warning: log is not reentrant, do not use it in server configurations.
const log = require('npmlog')

const vm = require('vm')
const repl = require('repl')

const os = require('os')
const util = require('util')

const asy = require('./asy.js')

// ES6: `import { WscriptAvoider} from 'wscript-avoider'
const WscriptAvoider = require('wscript-avoider').WscriptAvoider

// ES6: `import { CliCommand } from './cli-options.js'
const CliCommand = require('./cli-command.js').CliCommand

// ES6: `import { CliOptions } from './cli-options.js'
const CliOptions = require('./cli-options.js').CliOptions

// ES6: `import { CliHelp } from './cli-help.js'
const CliHelp = require('./cli-help.js').CliHelp

// ----------------------------------------------------------------------------

// Local promisified functions from the Node.js callbacks library.
const readFile = asy.promisify(fs.readFile)

// ----------------------------------------------------------------------------
// Logger
// Use the npm logger, although it is not reentrant.

// https://github.com/npm/npmlog
// Log levels
// log.addLevel('silly', -Infinity, { inverse: true }, 'sill')
// log.addLevel('verbose', 1000, { fg: 'blue', bg: 'black' }, 'verb')
// log.addLevel('info', 2000, { fg: 'green' })
// log.addLevel('http', 3000, { fg: 'green', bg: 'black' })
// log.addLevel('warn', 4000, { fg: 'black', bg: 'yellow' }, 'WARN')
// log.addLevel('error', 5000, { fg: 'red', bg: 'black' }, 'ERR!')
// log.addLevel('silent', Infinity)

// To configure the logger, use same options as npm.
// https://docs.npmjs.com/misc/config
// `-s`, `--silent`: `--loglevel silent`
// `-q`, `--quiet`: `--loglevel warn`
// `-d`: `--loglevel info`
// `-dd`, `--verbose`: `--loglevel verbose`
// `-ddd`: `--loglevel silly`
// `--color true/false`

// ============================================================================

/**
 * @classdesc
 * Base class for a CLI application.
 */
// export
class CliApplication {
  // --------------------------------------------------------------------------

  /**
   * @summary Application start().
   *
   * @returns {undefined} Does not return, it calls exit().
   *
   * @description
   * Start the CLI application, either in single shot
   * mode or interactive. (similar to _start() in POSIX)
   *
   * Called by the executable script in the bin folder.
   * Not much functionality here, just a wrapper to catch
   * global exceptions and call the CLI start implementation.
   *
   * For the exceptions to reach this top layer, all async functions
   * and all functions returning promises, must be called with `await`
   * otherwise the `UnhandledPromiseRejectionWarning` is currently
   * triggered.
   */
  static async start () {
    const Self = this
    try {
      // Extract the name from the last path element; ignore extensions, if any.
      const pgmName = path.basename(process.argv[1]).split('.')[0]

      // Avoid running on WScript. The journey may abruptly end here.
      WscriptAvoider.quitIfWscript(pgmName)

      // Redirect to implementation code. After some common inits,
      // if not interactive, it'll call main().
      await Self.doStart()
      // Pass through. Do not exit, to allow REPL to run.
    } catch (err) {
      if (err.name === 'Error') {
        // User triggered error. Treat it gently.
        console.error('Error: ' + err.message)
      } else {
        // System error, probably due to a bug.
        // Show the full stack trace.
        console.error(err.stack)
      }
      // Extension: if the `exitCode` property is added to error,
      // it is used as process exit code.
      const code = (err.exitCode !== undefined) ? err.exitCode : 1
      process.exit(code)
    }
    // Pass through. Do not exit, to allow REPL to run.
  }

  /**
   * @summary Implementation of a CLI starter.
   *
   * @returns {undefined} Nothing.
   *
   * @description
   * As for any CLI application, the main input comes from the
   * command line options, available in Node.js as the
   * `process.argv` array of strings.
   *
   * One important aspect that must not be ignored, is how to
   * differentiate when called from scripts with different names.
   *
   * `process.argv0`
   * On POSIX, it is 'node' (uninteresting).
   * On Windows, it is the node full path (uninteresting as well).
   *
   * `process.argv[0]` is the node full path.
   * On macOS it looks like `/usr/local/bin/node`.
   * On Ubuntu it looks like `/usr/bin/nodejs`
   * On Windows it looks like `C:\Program Files\nodejs\node.exe`.
   *
   * `process.argv[1]` is the full path of the invoking script.
   * On macOS it is either `/usr/local/bin/xsvd` or `.../bin/xsvd.js`.
   * On Ubuntu it is either `/usr/bin/xsvd` or `.../bin/xsvd.js`.
   * On Windows, it is a path inside the `AppData` folder
   * like `C:\Users\ilg\AppData\Roaming\npm\node_modules\xsvd\bin\xsvd.js`
   *
   * To call a program with different names, create multiple
   * executable scripts in the `bin` folder and by processing
   * `argv[1]` it is possible to differentiate between them.
   *
   * The communication with the actual CLI implementation is done via
   * the context object, which includes a console, a configuration
   * object and a few more properties.
   */
  static async doStart () {
    // Save the current class to be captured in the callbacks.
    const Self = this

    // To differentiate between multiple invocations with different
    // names, extract the name from the last path element; ignore
    // extensions, if any.
    Self.pgmName = path.basename(process.argv[1]).split('.')[0]

    // Set the application name, to make `ps` output more readable.
    process.title = Self.pgmName

    // Early pause; will be resumed after config is known,
    // and the log level was set.
    log.pause()

    // Dark colours on black background are very hard to see on white
    // screens, like macOS. Remove the background.
    if (os.platform() === 'darwin') {
      Self.fixLogColours(log)
    }

    // These are early messages, not shown immediately,
    // are delayed until the log level is known.
    log.info('it worked if it ends with', 'ok')
    log.silly('but you must be crazy!')
    log.info(`argv0: ${process.argv[1]}`)

    // Initialise the application, including commands and options.
    const context = Self.initialiseContext(null, Self.pgmName, console, log,
      null)

    const config = context.config
    Self.config = config

    // Parse the common options, for example the log level.
    CliOptions.parseOptions(process.argv, config)

    log.level = config.logLevel
    if (config.color !== undefined) {
      if (config.color) {
        log.enableColor()
      } else {
        log.disableColor()
      }
    }
    log.resume()

    process.argv.forEach((arg, index) => {
      log.verbose(`start arg${index}: '${arg}'`)
    })

    log.verbose(util.inspect(config))

    const serverPort = config.interactiveServerPort
    if (serverPort == null) {
      if (!config.isInteractive) {
        // Non interactive means single shot (batch mode);
        // execute the command received on the command line
        // and quit. This is the most common usage.

        config.invokedFromCli = true
        // App instances exist only within a given context.
        let app = new Self(context)

        const code = await app.main(process.argv.slice(2))
        process.exit(code)
      } else {
        // Interractive mode. Use the REPL (Read-Eval-Print-Loop)
        // to get a shell like prompt to enter sequences of commands.

        const domain = require('domain').create() // eslint-disable-line node/no-deprecated-api, max-len
        domain.on('error', Self.replErrorCallback.bind(Self))
        repl.start(
          {
            prompt: Self.pgmName + '> ',
            eval: Self.replEvaluatorCallback.bind(Self),
            completer: Self.replCompleter.bind(Self),
            domain: domain
          }).on('exit', () => {
            console.log('Done.')
            process.exit(0)
          })
        // Pass through...
      }
    } else {
      // ----------------------------------------------------------------------
      // Useful during development, to test if everything goes to the
      // correct stream.

      const net = require('net')

      console.log(`Listening on localhost:${serverPort}...`)

      const domainSock = require('domain').create() // eslint-disable-line node/no-deprecated-api, max-len
      domainSock.on('error', Self.replErrorCallback.bind())

      net.createServer((socket) => {
        console.log(`Connection opened from ${socket.address().address}.`)

        repl.start({
          prompt: Self.pgmName + '> ',
          input: socket,
          output: socket,
          eval: Self.replEvaluatorCallback.bind(Self),
          completer: Self.replCompleter.bind(Self),
          domain: domainSock
        }).on('exit', () => {
          console.log('Connection closed.')
          socket.end()
        })
      }).listen(serverPort)
      // Pass through...
    }
    // Be sure no exit() is called here, since it'll close the
    // process and prevent interactive usage, which is inherently
    // asynchronous.
    log.verbose('doStart() returns')
  }

  /**
   * @summary Explicit initialiser for the class object. Kind of a
   *  static constructor.
   *
   * @returns {undefined}.
   *
   * @description
   * Must override it in the derived implementation.
   */
  static initialise () {
    // Make uppercase explicit, to know it is a static method.
    const Self = this

    Self.doInitialise()
    assert(Self.rootPath, 'mandatory rootPath not set')
  }

  /**
   * @summary Default implementation for the static class initialiser.
   *
   * @returns {undefined}.
   *
   * @description
   * Override it in the derived implementation.
   */
  static doInitialise () {
    assert(false, 'Must override in derived implementation!')
  }

  /**
   * @summary Default initialiser for the configuration options.
   *
   * @param {object} config Reference to the configuration object.
   * @returns {undefined}
   *
   * @description
   * If further inits are needed, override `doInitialiseConfiguration()`
   * in the derived implementation.
   */
  static initialiseConfiguration (config) {
    config.isInteractive = false
    config.interactiveServerPort = null
  }

  /**
   * @summary Custome initialiser for the configuration options.
   *
   * @param {object} config Reference to the configuration object.
   * @returns {undefined}
   *
   * @description
   * Override it in the eived implementation.
   */
  static doInitialiseConfiguration (config) {
    config.isVersion = false
    config.isHelp = false
  }

  /**
   * @summary Initialise a minimal context object.
   *
   * @param {Object} ctx Reference to a context, or null to create an
   *   empty context.
   * @param {string} pgmName The invocation name of the program.
   * @param {Object} console_ Reference to a node console.
   * @param {Object} log_ Reference to a npm log instance.
   * @param {Object} config Reference to a configuration.
   * @returns {Object} Reference to context.
   */
  static initialiseContext (ctx, pgmName, console_ = null, log_ = null,
    config = null) {
    // Make uppercase explicit, to know it is a static method.
    const Self = this

    // Call the application initialisation callback, to prepare
    // the structure needed to manage the commands and option.
    if (!Self.isInitialised) {
      Self.initialise()

      Self.isInitialised = true
    }

    // Use the given context, or create an empty one.
    const context = ctx || vm.createContext()

    // REPL should always set the console, be careful not to
    // overwrite it.
    if (!context.console) {
      // Cannot use || because REPL context has only a getter.
      context.console = console_ || console
    }

    context.pgmName = pgmName

    context.log = log_ || log
    // console.log(log)

    context.config = config || {}
    Self.initialiseConfiguration(context.config)

    // Default log level: warn
    context.config.logLevel = context.config.logLevel || 'warn'

    context.cmdPath = process.argv[1]
    context.cwd = process.cwd()
    context.env = process.env
    context.argv = process.argv

    // For convenience, copy root path to instance too.
    context.rootPath = Self.rootPath

    return context
  }

  /**
   * @summary Fix log colours.
   *
   * @param {Object} log Reference to a npm log instance.
   * @returns {undefined} Nothing.
   *
   * @description
   * A small kludge to fix the ugly black backrounds
   * when running on a white screen, like macOS.
   */
  static fixLogColours (log) {
    for (let key in log.style) {
      if (log.style[key]) {
        // Basically remove the background property.
        delete log.style[key].bg
      }
    }
  }

  /**
   * @summary Read package JSON file.
   *
   * @param {string} rootPath The absolute path of the package.
   * @returns {Object} The package definition, unmodified.
   *
   * @description
   * By default, this function uses the package root path
   * stored in the class property during initialisation.
   * When called from tests, the path must be passed explicitly.
   */
  static async readPackageJson (rootPath = this.rootPath) {
    const filePath = path.join(rootPath, 'package.json')
    const fileContent = await readFile(filePath)
    assert(fileContent !== null)
    return JSON.parse(fileContent.toString())
  }

  // --------------------------------------------------------------------------

  /**
   * @summary Node.js callback.
   *
   * @callback nodeCallback
   * @param {number} responseCode
   * @param {string} responseMessage
   */

  /**
   * @summary A REPL completer.
   *
   * @param {string} linePartial The incomplete line.
   * @param {nodeCallback} callback Called on completion or error.
   * @returns {undefined} Nothing.
   *
   * @description
   * TODO: Add code.
   */
  static replCompleter (linePartial, callback) {
    // callback(null, [['babu', 'riba'], linePartial])
    // console.log(linePartial)
    // If no completion available, return error (an empty string does it too).
    // callback(null, [[''], linePartial])
    callback(new Error('no completion'))
  }

  /**
   * @summary REPL callback.
   *
   * @callback replCallback
   * @param {number} responseCode or null
   * @param {string} [responseMessage] If present, the string will
   *  be displayed.
   */

  /**
   * @summary Callback used by REPL when a line is entered.
   *
   * @param {string} cmdLine The entire line, unparsed.
   * @param {Object} context Reference to a context.
   * @param {string} filename The name of the file.
   * @param {replCallback} callback Called on completion or error.
   * @returns {undefined} Nothing
   *
   * @description
   * The function is passed to REPL with `.bind(Self)`, so it'll have
   * access to all class properties, like Self.pgmName.
   */
  static async replEvaluatorCallback (cmdLine, context, filename, callback) {
    // REPL always sets the console to point to its input/output.
    // Be sure it is so.
    assert(context.console !== undefined)
    const Self = this

    let app = null

    // It is mandatory to catch errors, this is an old style callback.
    try {
      // Fill in the given context, created by the REPL interpreter.
      // Start with an empty config, not the Self.config.
      // With the current non-reentrant log, use the global object.
      Self.initialiseContext(context, Self.pgmName, null, null, null)

      // Definitely an interactive session.
      context.config.isInteractive = true

      // And definitely the module was invoked from CLI, not from
      // another module.
      context.config.invokedFromCli = true

      // Create an instance of the application class, for the given context.
      app = new Self(context)

      // Split command line and remove any number of spaces.
      const args = cmdLine.trim().split(/\s+/)

      await app.main(args)
      app = null // Pale attempt to help the GC.

      // Success, but do not return any value, since REPL thinks it
      // is a string that must be displayed.
      callback(null)
    } catch (reason) {
      app = null
      // Failure, will display `Error: ${reason.message}`.
      callback(reason)
    }
  }

  /**
   * @summary Error callback used by REPL.
   *
   * @param {Object} err Reference to error triggered inside REPL.
   * @returns {undefined} Nothing.
   *
   * @description
   * This is tricky and took some time to find a workaround to avoid
   * displaying the stack trace on error.
   */
  static replErrorCallback (err) {
    // if (!(err instanceof SyntaxError)) {
    // System errors deserve their stack trace.
    if (!(err instanceof EvalError) && !(err instanceof SyntaxError) &&
      !(err instanceof RangeError) && !(err instanceof ReferenceError) &&
      !(err instanceof TypeError) && !(err instanceof URIError)) {
      // For regular errors it makes no sense to display the stack trace.
      err.stack = null
      // The error message will be displayed shortly, in the next handler,
      // registered by the REPL server.
    }
  }

  // --------------------------------------------------------------------------

  /**
   * Constructor, to remember the context.
   *
   * @param {Object} context Reference to a context.
   */
  constructor (context) {
    this.context = context
    this.context.log.verbose(`${this.constructor.name}.constructor()`)
  }

  /**
   * @summary Display the main help page.
   *
   * @returns {undefined}
   *
   * @description
   * Override it in the application if custom content is desired.
   */
  help () {
    this.context.log.verbose(`${this.constructor.name}.help()`)
    const help = new CliHelp(this.context)

    help.outputMainHelp(CliOptions.getCommandsFirstArray(),
      CliOptions.getCommonOptionGroups())
  }

  /**
   * @summary The main entry point for the `xsvd` command.
   *
   * @param {string[]} argv Arguments array.
   * @returns {number} The exit code.
   *
   * @description
   * Override it in the application if custom behaviour is desired.
   */
  async main (argv) {
    this.context.log.verbose(`${this.constructor.name}.main()`)
    const ctx = this.context
    const Self = this.constructor

    argv.forEach((arg, index) => {
      ctx.log.verbose(`main arg${index}: '${arg}'`)
    })

    // TODO: Does this belong here or in Cli?
    if (!ctx.package) {
      ctx.package = await Self.readPackageJson()
    }

    CliOptions.parseOptions(argv, ctx.config)

    // Early detection of `--version`, since it makes
    // all other irelevant.
    if (ctx.config.isVersion) {
      ctx.console.log(ctx.package.version)
      return 0 // Ok.
    }

    const mainArgs = []
    // Copy relevant args to local array.
    // Start with 0, possibly end with `--`.
    for (let i = 0; i < argv.length && argv[i] !== '--'; ++i) {
      mainArgs.push(argv[i].trim())
    }
    ctx.log.verbose(mainArgs)

    // Isolate commands as words with letters and inner dashes
    const cmds = []
    mainArgs.forEach((arg) => {
      const lowerCaseArg = arg.toLowerCase()
      if (lowerCaseArg.match(/^[a-z][a-z-]*/)) {
        cmds.push(lowerCaseArg)
      }
    })

    // Save the commands in the context, for possible later use, since
    // they are skiped when calling the command implementation.
    ctx.commands = cmds

    // If empty line or no commands and -h, output help message.
    if ((mainArgs.length === 0) ||
      (cmds.length === 0 && ctx.config.isHelp)) {
      this.help()
      return 0 // Ok, help explicitly called.
    }

    const found = CliOptions.findCommandClass(cmds, Self.rootPath, CliCommand)
    if (found) {
      const CmdDerivedClass = found.CmdClass

      // Use the original array, since we might have `--` options,
      // and skip already processed commands.
      const cmdArgs = argv.slice(cmds.length)
      cmdArgs.forEach((arg, index) => {
        ctx.log.verbose(`cmd arg${index}: '${arg}'`)
      })

      // Full name commands, not encountered shortcuts.
      ctx.fullCommands = found.cmds

      ctx.log.verbose(`'${ctx.pgmName} ${cmds}' started`)
      const cmdImpl = new CmdDerivedClass(this.context)
      const code = await cmdImpl.run(cmdArgs)
      ctx.log.verbose(`'${ctx.pgmName} ${cmds}' - returned ${code}`)
      return code
    } else {
      ctx.console.log(`Command '${cmds}' not supported.`)
      this.help()
      return 1 // Command not found.
    }
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The CliApplication class is added as a property of this object.
module.exports.CliApplication = CliApplication

// In ES6, it would be:
// export class CliApplication { ... }
// ...
// import { CliApplication } from 'cli-application.js'

// ----------------------------------------------------------------------------
