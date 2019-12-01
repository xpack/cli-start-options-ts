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
const os = require('os')

const semver = require('semver')

const Logger = require('@xpack/logger').Logger
const UpdateChecker = require('@xpack/update-checker').UpdateChecker

const CliCommand = require('./cli-command.js').CliCommand
const CliExitCodes = require('./cli-error.js').CliExitCodes
const CliError = require('./cli-error.js').CliError
const CliErrorSyntax = require('./cli-error.js').CliErrorSyntax

const CliUtils = require('./cli-utils.js').CliUtils
// const CmdsTree = require('./dm-commands.js').CmdsTree

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
 * @typedef {Object} CliApplication instance (inherited from CliCommand)
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
   * @param {Object} params The generic parameters object.
   * @param {String} params.programName Single string program name.
   * @param {String[]} params.argv Array of process arguments.
   * @param {String[]} params.env Array of environment variables.
   * @param {String} params.cwd Process current working folder.
   * @param {Console} params.console A node.js console.
   * @param {Boolean} params.enableInteractiveMode Set to enable
   *  interactive mode.
   * @param {Boolean} params.enableInteractiveServerMode Set to enable server
   *  mode.
   * @param {Boolean} params.enableProcessTitle Change the process title.
   * @param {String} params.minNodeVersion The minimum node version acceptable.
   * @returns {undefined}
   *
   * @static
   * @description
   * Create an instance of the application object using the process
   * environment and run it.
   *
   * The exit code is stored in process.exitCode and will be used when
   * the process completes, including all pending callbacks.
   *
   * The code should not normally call `exit()` because this will skip
   * scheduled callbacks.
   *
   * Called by the executable script in the bin folder.
   * Not much functionality here, just a wrapper get the defaults from the
   * environment.
   *
   * Since it must call the async `run()`, it must be async itself, but
   * the location where it is called is not async; thus it must be awaited
   * as a Promise, like `start().then()`.
   */
  static async start (params = {}) {
    // Explicit uppercase, to be obvious when a static property/method is used.
    const Self = this

    if (!params.argv) {
      params.argv = process.argv
    }
    assert(params.argv)

    if (!params.env) {
      params.env = process.env
    }
    assert(params.env)

    if (!params.cwd) {
      params.cwd = process.cwd()
    }
    assert(params.cwd)

    if (!params.console) {
      params.console = console
    }
    assert(params.console)

    if (!params.programName) {
      const parsed = path.parse(params.argv[1])
      params.programName = parsed.name
    }
    assert(params.programName)

    // This is the common use case, for scripts, update the process title.
    params.enableProcessTitle = true

    // Call the application class constructor, which must call super().
    const app = new Self(params)

    // Skip the first two, no longer needed.
    const argv = params.argv.slice(2)
    const code = await app.main(argv)

    process.exitCode = code
  }

  /**
   * @summary Create an application instance.
   *
   * @param {Object} params The generic parameters object.
   *
   * See start() for more details.
   */
  constructor (params) {
    assert(params)

    super(params)

    // ------------------------------------------------------------------------
    // Initialise the common options, that apply to all commands,
    // like options to set logger level, to display help, etc.
    // Due to the constructors order,
    // this happens before the application options are defined,
    // thus the enableInteractiveMode must be set in the params.
    this.cliOptions.addOptionsGroups(
      [
        {
          title: 'Common options',
          optionsDefs: [
            {
              options: ['-h', '--help'],
              init: ({ config }) => {
                config.isHelpRequest = false
              },
              action: ({ config }) => {
                config.isHelpRequest = true
              },
              isHelp: true
            },
            {
              options: ['--version'],
              msg: 'Show version',
              init: ({ config }) => {
                config.isVersionRequest = false
              },
              action: ({ config }) => {
                config.isVersionRequest = true
              },
              doProcessEarly: true
            },
            {
              options: ['--loglevel'],
              msg: 'Set log level',
              init: ({ config }) => {
                config.logLevel = defaultLogLevel
              },
              action: ({ config }, val) => {
                config.logLevel = val
              },
              values: ['silent', 'warn', 'info', 'verbose', 'debug', 'trace'],
              param: 'level'
            },
            {
              options: ['-s', '--silent'],
              msg: 'Disable all messages (--loglevel silent)',
              init: () => { },
              action: ({ config }) => {
                config.logLevel = 'silent'
              }
            },
            {
              options: ['-q', '--quiet'],
              msg: 'Mostly quiet, warnings and errors (--loglevel warn)',
              init: () => { },
              action: ({ config }) => {
                config.logLevel = 'warn'
              }
            },
            {
              options: ['--informative'],
              msg: 'Informative (--loglevel info)',
              init: () => { },
              action: ({ config }) => {
                config.logLevel = 'info'
              }
            },
            {
              options: ['-v', '--verbose'],
              msg: 'Verbose (--loglevel verbose)',
              init: () => { },
              action: ({ config }) => {
                config.logLevel = 'verbose'
              }
            },
            {
              options: ['-d', '--debug'],
              msg: 'Debug messages (--loglevel debug)',
              init: () => { },
              action: ({ config }) => {
                if (config.logLevel === 'debug') {
                  config.logLevel = 'trace'
                } else {
                  config.logLevel = 'debug'
                }
              }
            },
            {
              options: ['-dd', '--trace'],
              msg: 'Trace messages (--loglevel trace, -d -d)',
              init: () => { },
              action: ({ config }) => {
                config.logLevel = 'trace'
              }
            },
            {
              options: ['--no-update-notifier'],
              msg: 'Skip check for a more recent version',
              init: () => { },
              action: ({ config }) => {
                config.noUpdateNotifier = true
              }
            },
            {
              options: ['-C'],
              msg: 'Set current folder',
              init: (object) => {
                assert(object.processCwd)
                object.config.cwd = object.processCwd
              },
              action: ({ config, log }, val) => {
                if (path.isAbsolute(val)) {
                  config.cwd = val
                } else if (config.cwd) {
                  config.cwd = path.resolve(config.cwd, val)
                } else /* istanbul ignore next */ {
                  config.cwd = path.resolve(val)
                }
                log.debug(`set cwd: '${config.cwd}'`)
              },
              param: 'folder'
            }
          ]
        }
      ]
    )

    if (params.enableInteractiveMode) {
      this.cliOptions.addOptionsGroups(
        [
          {
            title: 'Common options',
            optionsDefs: [
              {
                options: ['-i', '--interactive'],
                msg: 'Enter interactive mode',
                init: ({ config }) => {
                  config.isInteractive = false
                },
                action: ({ config }) => {
                  config.isInteractive = true
                },
                doProcessEarly: true
              }
            ]
          }
        ])
      if (params.enableInteractiveServerMode) {
        this.cliOptions.addOptionsGroups(
          [
            {
              title: 'Common options',
              optionsDefs: [
                {
                  options: ['--interactive-server-port'],
                  msg: 'Port for interactive sessions',
                  init: ({ config }) => {
                    config.interactiveServerPort = undefined
                  },
                  action: ({ config }, val) => /* istanbul ignore next */ {
                    config.interactiveServerPort = val
                  },
                  hasValue: true,
                  doProcessEarly: true
                }
              ]
            }
          ]
        )
      }
    }
  }

  /**
   * @summary Implementation of a CLI starter.
   *
   * @param {String[]} args Arguments array.
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
  async main (args) {
    assert(args)

    // Explicit uppercase, to be obvious when a static property/method is used.
    const Self = this.constructor

    const log = this.log

    // These are early messages, not shown immediately,
    // are delayed until the log level is known.
    log.trace(`${this.constructor.name}.run()`)

    assert(this.rootAbsolutePath, '\'this.rootAbsolutePath\' must ' +
      'be set by the application constructor.')

    let exitCode = 0
    try {
      // The actual minimum is 7.7, but conservatively use 8.x.
      const minNodeVersion = this.private_.params.minNodeVersion || '8.0.0'
      if (semver.lt(process.version, minNodeVersion)) {
        this.console.error(
          `Please use a newer node (at least ${minNodeVersion}).\n`)
        return CliError.ERROR.PREREQUISITES
      }

      // When called as an internal module, do not set the
      // parent process tile.
      if (this.private_.params.enableProcessTitle) {
        // Set the application name, to make `ps` output more readable,
        // otherwise will probably read 'node'.
        process.title = this.programName
      }

      try {
        if (!this.package) {
          this.package = await CliUtils.readPackageJson(this.rootAbsolutePath)
        }
        log.verbose(`${this.package.description}`)

        log.debug(`${this.package.name}@${this.package.version}`)
        log.debug(`os arch=${os.arch()}, platform=${os.platform()},` +
          ` release=${os.release()}`)
        log.debug(`node ${process.version}`)

        // This was already parsed in `start()` to get the program name.
        log.debug(`params.argv[1]: ${this.processArgv[1]}`)

        // If the implementation does not define a help title, use
        // the package description.
        if (!this.helpOptions.title) {
          this.helpOptions.title = this.package.description
        }

        // This has double role, to prepare the commands tree and
        // to check if the commands are unique, otherwise this will
        // throw an assert().
        this.cmdsTree.buildCharTrees()

        // The tree root gets the top options.
        this.cmdsTree.helpOptions = this.helpOptions

        // Parse the common options, for the log level.
        // The result is in `this.config`.
        this.cliOptions.parseOptions({
          args,
          object: this
        })

        const config = this.config

        // This will flush the initial log.
        log.level = config.logLevel

        args.forEach((arg, index) => {
          log.debug(`main argv[${index}]: '${arg}'`)
        })

        log.trace(util.inspect(config))

        const serverPort = config.interactiveServerPort
        if (!serverPort) {
          if (!config.isInteractive) {
            // Non interactive means single shot (batch mode);
            // execute the command received on the command line
            // and quit. This is the most common usage.

            // Early detection of `--version`, since it makes
            // all other irrelevant.
            if (config.isVersionRequest) {
              log.always(this.package.version)
              return CliExitCodes.SUCCESS
            }

            if (!config.noUpdateNotifier) {
              this.updateChecker = new UpdateChecker({
                log: log,
                packageName: this.package.name,
                packageVersion: this.package.version
              })
              await this.updateChecker.initiateVersionRetrieval()
            }

            config.invokedFromCli = true

            // Pass the same arguments down the pipe, they'll be
            // parsed again.
            exitCode = await this.run(args)

            if (this.updateChecker) {
              await this.updateChecker.notifyIfUpdateIsAvailable()
            }

            return exitCode
          } else {
            // Interactive mode. Use the REPL (Read-Eval-Print-Loop)
            // to get a shell like prompt to enter sequences of commands.
            return new Promise((resolve, reject) => {
              // eslint-disable-next-line node/no-deprecated-api
              const domain = require('domain').create()
              domain.on('error', Self.replErrorCallback.bind(this, reject))
              repl.start(
                {
                  prompt: this.programName + '> ',
                  eval: Self.replEvaluatorCallback.bind(this),
                  completer: Self.replCompleter.bind(this),
                  domain: domain
                }).on('exit', () => {
                log.info('Done.')
                log.verbose('resolve(0)')
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
          if (ex.message) {
            this.log.error(ex.message)
          }
        } else /* istanbul ignore next */ {
          // System error, probably due to a bug (AssertionError).
          // Show the full stack trace.
          if (ex.stack) {
            this.log.error(ex.stack)
          }
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
   * @param {String[]} args Arguments array.
   * @returns {Number} The exit code.
   *
   * @description
   * Override it in the application if custom behaviour is desired.
   * If the application defines commands, they are called when identified,
   * otherwise the `doRun()` is called.
   *
   * @override
   */
  async run (args) {
    assert(args)

    const log = this.log
    log.trace(`${this.constructor.name}.main()`)

    const config = this.config

    args.forEach((arg, index) => {
      log.debug(`run argv[${index}]: '${arg}'`)
    })

    // Copy relevant params to local array.
    // Start with 0, possibly end with `--`.
    const mainArgs = this.cliOptions.filterOwnArguments(args)

    // Isolate commands as words with letters and inner dashes.
    // First non word (probably option) ends the list.
    const cmds = []
    if (this.cmdsTree.hasCommands()) {
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

    if (this.cmdsTree.hasCommands()) {
      // If commands are expected but not encountered,
      // output the help message and return syntax error.
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
    log.trace(`cmds=${cmds}`)

    let exitCode = CliExitCodes.SUCCESS
    try {
      if (this.cmdsTree.hasCommands()) {
        this.cmdNode = this.cmdsTree.findCommands(cmds)
        const cmdNode = this.cmdNode
        // Inherit title prefix from root node,
        // override if defined again by cmdNode.
        cmdNode.helpOptions = {
          titlePrefix: this.cmdsTree.helpOptions.titlePrefix || '',
          ...this.cmdNode.helpOptions
        }
        log.trace(cmdNode)

        this.matchedCommands = cmdNode.fullCommandsArray()
        const matchedCommands = this.matchedCommands

        // Full name commands, not the actual encountered shortcuts.
        log.debug(`Command(s): '${matchedCommands.join(' ')}'`)

        if (!cmdNode.modulePath) {
          // The usageMoreOptions is that of the command, if any.
          this.helpOptions = cmdNode.helpOptions
          this.help()
          return CliExitCodes.ERROR.SYNTAX
        }

        const modulePath = path.join(this.rootAbsolutePath, cmdNode.modulePath)
        const moduleExports = require(modulePath.toString())

        let CmdDerivedClass
        if (cmdNode.className) {
          CmdDerivedClass = moduleExports[cmdNode.className]
          if (!CmdDerivedClass ||
            !(CmdDerivedClass.prototype instanceof CliCommand)) {
            // Class not found
            assert(false, `A class named ${cmdNode.className} and derived ` +
              `from 'CliCommand' is not defined in '${modulePath}'.`)
          }
        } else {
          // Return the first exported class derived from `CliCommand`.
          for (const Obj of Object.values(moduleExports)) {
            if (Obj.prototype instanceof CliCommand) {
              CmdDerivedClass = Obj
              break
            }
          }
          if (!CmdDerivedClass) {
            // Module not found
            assert(false, 'A class derived from \'CliCommand\' not ' +
              `found in '${modulePath}'.`)
          }
        }

        // Use the original array, since we might have `--` options,
        // and skip already processed commands.
        const cmdArgv = args.slice(matchedCommands.length)
        cmdArgv.forEach((arg, index) => {
          log.trace(`cmd argv[${index}]: '${arg}'`)
        })

        // Instantiate the command, in preparation for execution.
        const cmdImpl = new CmdDerivedClass({
          ...this,
          cmdNode: cmdNode,
          helpOptions: cmdNode.helpOptions,
          matchedCommands: matchedCommands
        })

        log.debug(`'${this.programName} ` +
          `${matchedCommands.join(' ')}' started`)

        exitCode = await cmdImpl.run(cmdArgv)

        // Avoid reuse of the start timestamp.
        this.startTime = undefined

        log.debug(`'${this.programName} ` +
          `${matchedCommands.join(' ')}' - returned ${exitCode}`)
      } else {
        log.debug(`'${this.programName} started`)

        // No commands, try the simple main implementation.
        this.matchedCommands = []
        exitCode = await this.doRun(args)
        this.matchedCommands = undefined

        log.debug(`'${this.programName} started - returned ${exitCode}`)
      }
    } catch (ex) {
      exitCode = isNaN(ex.exitCode) ? CliExitCodes.ERROR.APPLICATION
        : ex.exitCode
      if (ex instanceof CliErrorSyntax) {
        // CLI triggered error. Treat it gently and try to be helpful.
        if (ex.message) {
          log.error(ex.message)
        }
        this.help()
        exitCode = isNaN(ex.exitCode) ? CliExitCodes.ERROR.SYNTAX
          : ex.exitCode
      } else if (ex instanceof CliError) {
        // Other CLI triggered error. Treat it gently.
        if (ex.message) {
          log.error(ex.message)
        }
      } else {
        // System error, probably due to a bug (AssertionError).
        // Show the full stack trace.
        if (ex.stack) {
          log.error(ex.stack)
        }
      }
      log.debug(`'${this.programName} started - returned ${exitCode}`)
    }
    return exitCode
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
   * access to an instance, and from there to the class, to create instances.
   */
  static replEvaluatorCallback (cmdLine, context, filename, callback) {
    // REPL always sets the console to point to its input/output.
    // Be sure it is so.
    assert(context.console)

    // Explicit uppercase, to be obvious when a static property/method is used.
    const Self = this.constructor

    // It is mandatory to catch errors, this is an old style callback.
    try {
      // Create an instance of the application class, for the same
      // set of params.
      const app = new Self({
        ...this.private_.params
      })

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
