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
 * This file provides the CLI startup code. It creates an instance
 * and calls the module `main()` code.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')
const path = require('path')

const repl = require('repl')

const util = require('util')
const process = require('process')

const semver = require('semver')

const WscriptAvoider = require('wscript-avoider').WscriptAvoider
const Logger = require('@xpack/logger').Logger

const CliCommand = require('./cli-command.js').CliCommand
const CliHelp = require('./cli-help').CliHelp
const CliExitCodes = require('./cli-error.js').CliExitCodes
const CliError = require('./cli-error.js').CliError
const CliErrorSyntax = require('./cli-error.js').CliErrorSyntax

const UpgradeChecker = require('./upgrade-checker.js').UpgradeChecker
const CliUtil = require('./cli-util.js').CliUtil

// ----------------------------------------------------------------------------
// Logger configuration
//
// `-s`, `--silent`: `--loglevel silent` (not even errors)
// `-q`, `--quiet`: `--loglevel warn` (errors and warnings)
// `--informative --loglevel info` (default)
// `-v`, `--verbose`: `--loglevel verbose`
// `-d`, '--debug': `--loglevel debug`
// `-dd`, '--trace': `--loglevel trace`

const defaultLogLevel = Logger.defaultLevel // Currently 'info'

// ----------------------------------------------------------------------------
// Exit codes (see CliError.js):
// - 0 = Ok
// - 1 = Syntax error, help()
// - 2 = Application error
// - 3 = Input error (no file, no folder, wrong format, etc)
// - 4 = Output error (cannot create file, cannot write, etc)
// - 5 = Child return error
// - 6 = Prerequisites (like node version)
// - 7 = Mismatched type, configuration error, unimplemented, unsupported.

// ============================================================================

/*
 * Command line options
 * --------------------
 *
 * As for any CLI application, the main input comes from the
 * command line options, available in Node.js as the
 * `process.argv` array of strings.
 *
 * `process.argv0` (Node.js specific)
 * On POSIX, it is 'node' (uninteresting).
 * On Windows, it is the node full path (uninteresting as well).
 *
 * `process.argv[0]` is the node full path.
 * On macOS it looks like `${HOME}/Library/npm/bin` or `/usr/local/bin/node`.
 * On Ubuntu it looks like `${HOME}/opt/bin` or `/usr/bin/nodejs`
 * On Windows it looks like `C:\Program Files\nodejs\node.exe`.
 *
 * `process.argv[1]` is the full path of the invoking script.
 * On macOS it is either `${HOME}/Library/npm/bin/xyz`, or
 * `/usr/local/bin/xyz` or `.../bin/xyz.js`.
 * On Ubuntu it is either `${HOME}/opt/bin/xyz`, or
 * `/usr/bin/xyz` or `.../bin/xyz.js`.
 * On Windows, it is a path inside the `%AppData%` folder
 * like `C:\Users\ilg\AppData\Roaming\npm\node_modules\xyz\bin\xyz.js`
 *
 * One important aspect that must not be ignored, is how to
 * differentiate when called from scripts with different names.
 *
 * To call a program with different names, create multiple
 * executable scripts in the `bin` folder and by processing
 * `argv[1]` it is possible to differentiate between them.
 *
 * Current path
 * ------------
 *
 * The process current path is available as `process.cwd()`; it is
 * passed down as `processCwd`.
 *
 * For reentrancy reasons, **do not set** the process current path,
 * and be sure all relative paths are converted to absolute using
 * `config.cwd`.
 */

/**
 * @typedef {Object} CliApplication instance (this)
 * @property {Console} console
 * @property {Logger} log
 * @property {String} programName
 * @property {String} processCwd
 * @property {Object} config
 * @property {String[]} matchedCommands
 * @property {CliOptions} cliOptions
 * @property {Date} startTime
 * @property {String[]} processArgv Array of process arguments.
 * @property {String[]} processEnv Array of environment variables.
 * @property {String} rootAbsolutePath (must be set by user constructor!)
 * @property {Object} package
 */

/**
 * @typedef {Object} Config
 * @property {String} cwd The actual current working folder, from -C.
 * @property {Number} logLevel The actual log level.
 * @property {Boolean} isInteractive
 * @property {Boolean} invokedFromCli
 * @property {Boolean} isVersionRequest
 */

// ============================================================================

/**
 * @classdesc
 * Base class for a CLI application.
 */
// export
class CliApplication extends CliCommand {
  /**
   * @summary Application start().
   *
   * @param {Object} args The generic arguments object.
   * @param {String} args.programName Single string program name.
   * @param {String[]} args.argv Array of process arguments.
   * @param {String[]} args.env Array of environment variables.
   * @param {String} args.cwd Process current working folder.
   * @param {Console} args.console A node.js console.
   * @param {Boolean} args.enableInteractiveMode Set to enable interactive mode.
   * @param {Boolean} args.enableInteractiveServerMode Set to enable server
   *  mode.
   * @param {Boolean} args.enableProcessTitle Change the process title.
   * @param {String} args.minNodeVersion The minimum node version acceptable.
   * @returns {Number|Promise} The process exit code, or a promise
   *  that resolves to the exit code, when REPL is used.
   *
   * @static
   * @description
   * Create an instance of the application object using the process
   * environment, run it and exit the process.
   *
   * Called by the executable script in the bin folder.
   * Not much functionality here, just a wrapper get the defaults from the
   * environment.
   *
   * Since it must call the async `run()`, it must be async itself, but
   * the location where it is called is not async; thus it must be awaited
   * as a Promise, like `start().then((code) => process.exit(code))`.
   */
  static async start (args = {}) {
    // Explicit uppercase, to be obvious when a static property/method is used.
    const Self = this

    if (!args.argv) {
      args.argv = process.argv
    }
    assert(args.argv)

    if (!args.env) {
      args.env = process.env
    }
    assert(args.env)

    if (!args.cwd) {
      args.cwd = process.cwd()
    }
    assert(args.cwd)

    if (!args.console) {
      args.console = console
    }
    assert(args.console)

    if (!args.programName) {
      const parsed = path.parse(args.argv[1])
      args.programName = parsed.name
    }
    assert(args.programName)

    // This is the common use case, for scripts, update the process title.
    args.enableProcessTitle = true

    // Call the application class constructor, which must call super().
    const app = new Self(args)

    // Skip the first two, no longer needed.
    const argv = args.argv.slice(2)
    const code = await app.main(argv)

    return code
  }

  /**
   * @summary Create an application instance.
   *
   * @param {Object} args The generic arguments object.
   *
   * See start() for more details.
   */
  constructor (args) {
    assert(args, 'There must be args.')

    super(args)

    assert(args.argv)
    this.processArgv = args.argv

    assert(args.env)
    this.processEnv = args.env

    if (args.rootAbsolutePath) {
      this.rootAbsolutePath = args.rootAbsolutePath
    }

    if (args.package) {
      this.package = args.package
    }

    if (!this.private_) {
      this.private_ = {}
    }
    this.private_.args = args

    // ------------------------------------------------------------------------
    // Initialise the common options, that apply to all commands,
    // like options to set logger level, to display help, etc.
    // Due to the constructors order,
    // this happens before the application options are defined,
    // thus the enableInteractiveMode must be set in the args.
    this.cliOptions.addOptionGroups(
      [
        {
          title: 'Common options',
          optionDefs: [
            {
              options: ['-h', '--help'],
              action: (context) => {
                context.config.isHelpRequest = true
              },
              init: (context) => {
                context.config.isHelpRequest = false
              },
              isHelp: true
            },
            {
              options: ['--version'],
              msg: 'Show version',
              action: (context) => {
                context.config.isVersionRequest = true
              },
              init: (context) => {
                context.config.isVersionRequest = false
              },
              doProcessEarly: true
            },
            {
              options: ['--loglevel'],
              msg: 'Set log level',
              action: (context, val) => {
                context.config.logLevel = val
              },
              init: (context) => {
                context.config.logLevel = defaultLogLevel
              },
              values: ['silent', 'warn', 'info', 'verbose', 'debug', 'trace'],
              param: 'level'
            },
            {
              options: ['-s', '--silent'],
              msg: 'Disable all messages (--loglevel silent)',
              action: (context) => {
                context.config.logLevel = 'silent'
              },
              init: () => { }
            },
            {
              options: ['-q', '--quiet'],
              msg: 'Mostly quiet, warnings and errors (--loglevel warn)',
              action: (context) => {
                context.config.logLevel = 'warn'
              },
              init: () => { }
            },
            {
              options: ['--informative'],
              msg: 'Informative (--loglevel info)',
              action: (context) => {
                context.config.logLevel = 'info'
              },
              init: () => { }
            },
            {
              options: ['-v', '--verbose'],
              msg: 'Verbose (--loglevel verbose)',
              action: (context) => {
                context.config.logLevel = 'verbose'
              },
              init: () => { }
            },
            {
              options: ['-d', '--debug'],
              msg: 'Debug messages (--loglevel debug)',
              action: (context) => {
                const config = context.config
                if (config.logLevel === 'debug') {
                  config.logLevel = 'trace'
                } else {
                  config.logLevel = 'debug'
                }
              },
              init: () => { }
            },
            {
              options: ['-dd', '--trace'],
              msg: 'Trace messages (--loglevel trace, -d -d)',
              action: (context) => {
                context.config.logLevel = 'trace'
              },
              init: () => { }
            },
            {
              options: ['--no-update-notifier'],
              msg: 'Skip check for a more recent version',
              action: (context) => {
                context.config.noUpdateNotifier = true
              },
              init: () => { }
            },
            {
              options: ['-C'],
              msg: 'Set current folder',
              action: (context, val) => {
                const config = context.config
                if (path.isAbsolute(val)) {
                  config.cwd = val
                } else if (config.cwd) {
                  config.cwd = path.resolve(config.cwd, val)
                } else /* istanbul ignore next */ {
                  config.cwd = path.resolve(val)
                }
                context.log.debug(`set cwd: '${config.cwd}'`)
              },
              init: (context) => {
                context.config.cwd = context.processCwd
              },
              param: 'folder'
            }
          ]
        }
      ]
    )

    if (args.enableInteractiveMode) {
      this.cliOptions.appendToOptionGroups('Common options',
        [
          {
            options: ['-i', '--interactive'],
            msg: 'Enter interactive mode',
            action: (context) => {
              context.config.isInteractive = true
            },
            init: (context) => {
              context.config.isInteractive = false
            },
            doProcessEarly: true
          }
        ]
      )
      if (args.enableInteractiveServerMode) {
        this.cliOptions.appendToOptionGroups('Common options',
          [
            {
              options: ['--interactive-server-port'],
              msg: 'Port for interactive sessions',
              action: (context, val) => /* istanbul ignore next */ {
                context.config.interactiveServerPort = val
              },
              init: (context) => {
                context.config.interactiveServerPort = undefined
              },
              hasValue: true,
              doProcessEarly: true
            }
          ]
        )
      }
    }
  }

  /**
   * @summary Implementation of a CLI starter.
   *
   * @param {String[]} argv Arguments array.
   * @returns {Number|Promise} The process exit code, or a promise
   *  that resolves to the exit code, when REPL is used.
   *
   * @static
   * @description
   * The communication with the actual CLI implementation is done via
   * the instance, which includes a logger, a configuration
   * object and a few more properties.
   *
   * @override
   */
  async main (argv) {
    // Explicit uppercase, to be obvious when a static property/method is used.
    const Self = this.constructor

    const log = this.log

    // These are early messages, not shown immediately,
    // are delayed until the log level is known.
    log.trace(`${this.constructor.name}.run()`)

    assert(this.rootAbsolutePath)

    let exitCode = 0
    try {
      // The actual minimum is 7.7, but conservatively use 8.x.
      const minNodeVersion = this.private_.args.minNodeVersion || '8.0.0'
      if (semver.lt(process.version, minNodeVersion)) {
        this.console.error(
          `Please use a newer node (at least ${minNodeVersion}).\n`)
        return CliError.ERROR.PREREQUISITES
      }

      // Avoid running on WScript. The journey may abruptly end here.
      WscriptAvoider.quitIfWscript(this.programName)

      // When called as an internal module, do not set the
      // parent process tile.
      if (this.private_.args.enableProcessTitle) {
        // Set the application name, to make `ps` output more readable,
        // otherwise will probably read 'node'.
        process.title = this.programName
      }

      try {
        if (!this.package) {
          this.package = await CliUtil.readPackageJson(this.rootAbsolutePath)
        }
        log.verbose(`${this.package.description}`)

        // This was already parsed in `start()` to get the program name.
        log.debug(`args.argv[1]: ${this.processArgv[1]}`)

        const optionGroups = this.cliOptions.getCommonOptionGroups()
        // The package must be already available, it may be used for
        // defaults.
        this.cliOptions.initOptionGroups(optionGroups, this)

        // Parse the common options, for the log level.
        // The result is in `this.config`.
        const remaining = this.cliOptions.parseOptions(argv, this)

        const config = this.config

        // This will flush the initial log.
        log.level = config.logLevel

        argv.forEach((arg, index) => {
          log.debug(`main argv[${index}]: '${arg}'`)
        })

        log.trace(util.inspect(config))

        const serverPort = config.interactiveServerPort
        if (!serverPort) {
          if (!config.isInteractive) {
            // Non interactive means single shot (batch mode);
            // execute the command received on the command line
            // and quit. This is the most common usage.

            config.invokedFromCli = true

            exitCode = await this.run(remaining)

            if (this.upgradeChecker) {
              await this.upgradeChecker.checkUpdate()
            }

            return exitCode
          } else {
            // Interactive mode. Use the REPL (Read-Eval-Print-Loop)
            // to get a shell like prompt to enter sequences of commands.
            return new Promise((resolve, reject) => {
              const domain = require('domain').create() // eslint-disable-line node/no-deprecated-api, max-len
              domain.on('error', Self.replErrorCallback.bind(this, reject))
              repl.start(
                {
                  prompt: this.programName + '> ',
                  eval: Self.replEvaluatorCallback.bind(this),
                  completer: Self.replCompleter.bind(this),
                  domain: domain
                }).on('exit', () => {
                log.info('Done.')
                log.verbose(`exit(0)`)
                resolve(0)
              }).on('reset', () => {
                log.info('Reset not implemented.')
              })
            })
          }
        } else /* istanbul ignore next */ {
          // ------------------------------------------------------------------
          // Useful during development, to test if everything goes to the
          // correct stream.

          const net = require('net')

          this.console.log(`Listening on localhost:${serverPort}...`)

          return new Promise((resolve, reject) => {
            const domainSock = require('domain').create() // eslint-disable-line node/no-deprecated-api, max-len
            // Do not pass the resolve, to keep the server running forever.
            domainSock.on('error', Self.replErrorCallback.bind(this, null))

            net.createServer((socket) => {
              this.console.log('Connection opened from ' +
                `${socket.address().address}.`)

              repl.start({
                prompt: this.programName + '> ',
                input: socket,
                output: socket,
                eval: Self.replEvaluatorCallback.bind(this),
                completer: Self.replCompleter.bind(this),
                domain: domainSock
              }).on('exit', () => {
                this.console.log('Connection closed.')
                socket.end()
              })
            }).listen(serverPort)
            // Do not resolve, to run forever.
          })
        }
        // Should never reach this.
      } catch (ex) {
        // This should catch possible errors during inits, otherwise
        // in main(), another catch will apply.
        exitCode = isNaN(ex.exitCode) ? CliExitCodes.ERROR.APPLICATION
          : ex.exitCode
        if (!this.log.hasLevel()) {
          this.log.level = Logger.defaultLevel
        }
        if (ex instanceof CliError) {
          // CLI triggered error. Treat it gently.
          this.log.error(ex.message)
        } else /* istanbul ignore next */ {
          // System error, probably due to a bug (AssertionError).
          // Show the full stack trace.
          this.log.error(ex.stack)
        }
        this.log.verbose(`exit(${exitCode})`)
      }
    } catch (ex) {
      this.console.error(ex.stack)
      exitCode = CliExitCodes.ERROR.PREREQUISITES
    }
    // Do not call process.exit(), to allow REPL to run.
    return exitCode
  }

  /**
   * @summary The main entry point for the application.
   *
   * @param {String[]} argv Arguments array.
   * @returns {Number} The exit code.
   *
   * @description
   * Override it in the application if custom behaviour is desired.
   * If the application defines commands, they are called when identified,
   * otherwise the `doRun()` is called.
   *
   * @override
   */
  async run (argv) {
    const log = this.log
    log.trace(`${this.constructor.name}.main()`)

    const config = this.config

    argv.forEach((arg, index) => {
      log.debug(`run argv[${index}]: '${arg}'`)
    })

    // Early detection of `--version`, since it makes
    // all other irrelevant.
    if (config.isVersionRequest) {
      log.always(this.package.version)
      return CliExitCodes.SUCCESS
    }

    if (!config.noUpdateNotifier) {
      this.upgradeChecker = new UpgradeChecker({
        context: this
      })
      await this.upgradeChecker.getLatestVersion()
    }

    // Copy relevant args to local array.
    // Start with 0, possibly end with `--`.
    const mainArgs = this.cliOptions.filterOwnArguments(argv)

    // Isolate commands as words with letters and inner dashes.
    // First non word (probably option) ends the list.
    const cmds = []
    if (this.cliOptions.hasCommands()) {
      for (const arg of mainArgs) {
        const lowerCaseArg = arg.toLowerCase()
        if (lowerCaseArg.match(/^[a-z][a-z-]*/)) {
          cmds.push(lowerCaseArg)
        } else {
          break
        }
      }
    }

    // If no commands and -h, output the help message.
    if ((cmds.length === 0) && config.isHelpRequest) {
      this.help({
        outputAlways: true
      })
      return CliExitCodes.SUCCESS // Help explicitly called.
    }

    if (this.cliOptions.hasCommands()) {
      // If no commands, output help message and return error.
      if (cmds.length === 0) {
        log.error('Missing mandatory command.')
        this.help()
        return CliExitCodes.ERROR.SYNTAX // No commands.
      }
    }

    log.debug(`cwd()='${process.cwd()}'`)
    // Ensure the current folder exists (in case of `-C`)
    // await mkdirp(config.cwd)
    log.debug(`config.cwd='${config.cwd}'`)

    let exitCode = CliExitCodes.SUCCESS
    try {
      const found = this.cliOptions.findCommandClass(cmds,
        this.rootAbsolutePath, CliCommand)
      if (CliCommand.isPrototypeOf(found.CmdClass)) {
        const CmdDerivedClass = found.CmdClass

        // Full name commands, not the actual encountered shortcuts.
        log.debug(`Command(s): '${found.matchedCommands.join(' ')}'`)

        // Use the original array, since we might have `--` options,
        // and skip already processed commands.
        const cmdArgv = argv.slice(cmds.length - found.rest.length)
        cmdArgv.forEach((arg, index) => {
          log.trace(`cmd argv[${index}]: '${arg}'`)
        })

        // Instantiate the command, in preparation for execution.
        const cmdImpl = new CmdDerivedClass({
          log: this.log,
          cliOptions: this.cliOptions,
          matchedCommands: found.matchedCommands,
          startTime: this.startTime,
          programName: this.programName,
          config: this.config,
          package: this.package,
          cwd: this.processCwd,
          rootAbsolutePath: this.rootAbsolutePath,
          console: this.console
        })

        log.debug(`'${this.programName} ` +
          `${found.matchedCommands.join(' ')}' started`)

        exitCode = await cmdImpl.run(cmdArgv)
        log.debug(`'${this.programName} ` +
          `${found.matchedCommands.join(' ')}' - returned ${exitCode}`)
      } else {
        log.debug(`'${this.programName} started`)

        // No commands, try the simple main implementation.
        this.matchedCommands = found.matchedCommands
        exitCode = await this.doRun(argv)
        this.matchedCommands = undefined

        log.debug(`'${this.programName} started - returned ${exitCode}`)
      }
    } catch (ex) {
      exitCode = isNaN(ex.exitCode) ? CliExitCodes.ERROR.APPLICATION
        : ex.exitCode
      if (ex instanceof CliErrorSyntax) {
        // CLI triggered error. Treat it gently and try to be helpful.
        log.error(ex.message)
        this.help()
        exitCode = isNaN(ex.exitCode) ? CliExitCodes.ERROR.SYNTAX
          : ex.exitCode
      } else if (ex instanceof CliError) {
        // Other CLI triggered error. Treat it gently.
        log.error(ex.message)
      } else {
        // System error, probably due to a bug (AssertionError).
        // Show the full stack trace.
        log.error(ex.stack)
      }
      log.debug(`'${this.programName} started - returned ${exitCode}`)
    }
    return exitCode
  }

  /**
   * @summary Output command help
   *
   * @param {Object} args The generic arguments object.
   * @returns {undefined} Nothing.
   *
   * @description
   * Override it in the application if custom content is desired.
   *
   * @override
   */
  help (args = {}) {
    const log = this.log
    log.trace(`${this.constructor.name}.help()`)

    const help = new CliHelp({
      context: this,
      outputAlways: args.outputAlways
    })

    const commonOptionGroups = this.optionsGroups ||
      this.cliOptions.getCommonOptionGroups()
    const title = this.helpTitle || this.package.description
    assert(title, 'Mandatory helpTitle missing.')

    help.outputAll({
      obj: this,
      matchedCommands: this.matchedCommands,
      title,
      optionGroups: commonOptionGroups
    })
  }

  /**
   * @summary Output the 'where' details.
   *
   * @param {CLiHelp} helper Reference to a helper object.
   * @param {Object} more Object used to handle the two pass processing.
   * @returns {undefined} Nothing.
   *
   * @description
   * For the application help, this must explain what <command> can be,
   * i.e. the list of available top level commands.
   *
   * @override
   */
  doHelpWhere (helper, more) {
    if (!more.isFirstPass) {
      let cmds = this.cliOptions.getCommandsFirstArray().sort()
      if (cmds.length > 0) {
        helper.output()
        helper.output('where <command> is one of:')
        let buf = null
        cmds.forEach((cmd, i) => {
          if (buf === null) {
            buf = '  '
          }
          buf += cmd
          if (i !== (cmds.length - 1)) {
            buf += ', '
          }
          if (buf.length > more.rightLimit) {
            helper.output(buf)
            buf = null
          }
        })
        if (buf != null) {
          helper.output(buf)
          buf = null
        }
      }
    }
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
   * @static
   * @description
   * TODO: Add code.
   */
  static replCompleter (linePartial, callback) /* istanbul ignore next */ {
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
   * @param {Object} context Reference to a JS context.
   * @param {string} filename The name of the file.
   * @param {replCallback} callback Called on completion or error.
   * @returns {undefined} Nothing
   *
   * @static
   * @description
   * The function is passed to REPL with `.bind(this)`, so it'll have
   * access to an instance, and from here to the class, to create instances.
   */
  static replEvaluatorCallback (cmdLine, context, filename, callback) {
    // REPL always sets the console to point to its input/output.
    // Be sure it is so.
    assert(context.console)

    // Explicit uppercase, to be obvious when a static property/method is used.
    const Self = this.constructor

    // It is mandatory to catch errors, this is an old style callback.
    try {
      // Create an instance of the application class, for the given context.
      const app = new Self(this.private_.args)

      // Definitely an interactive session.
      app.config.isInteractive = true

      // And definitely the module was invoked from CLI, not from
      // another module.
      app.config.invokedFromCli = true

      // Split command line and remove any number of spaces.
      const argv = cmdLine.trim().split(/\s+/)

      app.main(argv).then((code) => {
        // Success, but do not return any value, since REPL thinks it
        // is a string that must be displayed.
        callback(null)
      }).catch((ex) => {
        // Failure, will display `Error: ${ex.message}`.
        callback(ex)
      })
    } catch (ex) /* istanbul ignore next */ {
      // Failure, will display `Error: ${ex.message}`.
      callback(ex)
    }
  }

  /**
   * @summary Error callback used by REPL.
   *
   * @param {Function} reject Promise reject function.
   * @param {Object} err Reference to error triggered inside REPL.
   * @returns {undefined} Nothing.
   *
   * @static
   * @description
   * This is tricky and took some time to find a workaround to avoid
   * displaying the stack trace on error.
   */
  static replErrorCallback (reject, err) /* istanbul ignore next */ {
    // if (!(err instanceof SyntaxError)) {
    // System errors deserve their stack trace.
    if (!(err instanceof EvalError) && !(err instanceof SyntaxError) &&
      !(err instanceof RangeError) && !(err instanceof ReferenceError) &&
      !(err instanceof TypeError) && !(err instanceof URIError)) {
      // For regular errors it makes no sense to display the stack trace.
      // console.log(err)
      err.stack = null
      // The error message will be displayed shortly, in the next handler,
      // registered by the REPL server.
      if (reject) {
        reject(err)
      }
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
