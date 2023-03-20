/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/license/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * This file provides the CLI startup code. It prepares a context
 * and calls the module `main()` code.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import { Console } from 'node:console'
import * as net from 'node:net'
import * as path from 'node:path'
// import * as process from 'node:process'
import * as readline from 'node:readline'
import * as repl from 'node:repl'
import * as util from 'node:util'
import * as vm from 'node:vm'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/@xpack/logger
import { Logger, LogLevel } from '@xpack/logger'

// https://www.npmjs.com/package/@xpack/update-checker
import { UpdateChecker } from '@xpack/update-checker'

// https://www.npmjs.com/package/make-dir
import makeDir from 'make-dir'

// https://www.npmjs.com/package/semver
import * as semver from 'semver'

// ----------------------------------------------------------------------------

// import { WscriptAvoider } from 'wscript-avoider'

import { Command } from './command.js'
import { CommandsTree, FoundCommandModule } from './commands-tree.js'
import { Context } from './context.js'
// import { Configuration } from './configuration.js'
import { Options } from './options.js'

import { Help, MultiPass } from './help.js'
import { ExitCodes } from './error.js'
import * as cli from './error.js'
import { readPackageJson } from './utils.js'

// ----------------------------------------------------------------------------
// Logger configuration
//
// `-s`, `--silent`: `--loglevel silent` (not even errors)
// `-q`, `--quiet`: `--loglevel warn` (errors and warnings)
// `--informative --loglevel info` (default)
// `-v`, `--verbose`: `--loglevel verbose`
// `-d`, '--debug': `--loglevel debug`
// `-dd`, '--trace': `--loglevel trace`

export const defaultLogLevel = 'info'

// ----------------------------------------------------------------------------
// Exit codes:
// - 0 = Ok
// - 1 = Syntax error
// - 2 = Application error
// - 3 = Input error (no file, wrong format, etc)
// - 4 = Output error (cannot create file, cannot write, etc)
// - 5 = Child return error
// - 6 = Prerequisites (like node version)

// ============================================================================

/**
 * @summary Node.js REPL callback.
 *
 * @callback nodeReplCallback
 */
type nodeReplCallback = (
  err?: null | Error,
  result?: readline.CompleterResult
) => void

// ----------------------------------------------------------------------------

/**
 * @classdesc
 * Base class for a CLI application.
 *
 * Normally there is only one instance of this class, but when a
 * socket REPL is used, multiple instances can be created for multiple
 * net clients, a good reason for not using static variables.
 *
 */
export class Application {
  // --------------------------------------------------------------------------

  /**
   * @summary Application start().
   *
   * @returns The process exit code.
   *
   * @description
   * Convenience code to create an application instance.
   *
   * Not much functionality here, just a wrapper to:
   * - create the context
   * - instantiate the derived application class
   * - chain to the instance `run()`
   * - catch global exceptions.
   *
   * Note: keep it as minimal as possible and let the instance do the work.
   *
   * Called by the executable script in the bin folder.
   * To pass the exit code back to the system, use something like:
   *
   * ```
   * Xpm.start().then((code) => { process.exitCode = code })
   * ```
   */
  static async start (): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ThisClass = this // Simply to make it look like a class.

    // Create the log early, to have it in the exception handlers.
    const log = new Logger({ console })
    let exitCode = ExitCodes.SUCCESS
    let application
    try {
      const programName = Application.getProgramName()

      // Create the application context.
      const context = new Context({
        programName,
        log,
        console: log.console
      })

      // Instantiate the derived class.
      application = new ThisClass(context)

      // Redirect to the instance runner. It might start a REPL.
      exitCode = await application.prepareAndRun()
      // Pass through. Do not exit, to allow REPL to run.
    } catch (err: any) {
      // If the initialisation was completed, the log level must have been
      // set, but for early quits the level might still be undefined.
      if (!log.hasLevel) {
        log.level = defaultLogLevel
        // This is the moment when buffered logs are written out.
      }
      // This should catch possible errors during inits, otherwise
      // in run() there is another catch.
      exitCode = ExitCodes.ERROR.APPLICATION
      if (err instanceof cli.Error) {
        // CLI triggered error. Treat it gently.
        log.error(err.message)
        exitCode = err.exitCode
      } else if (err.constructor === Error ||
        err.constructor === SyntaxError ||
        err.constructor === TypeError) {
        // Other error. Treat it gently too.
        console.error(err.message)
      } else /* istanbul ignore next */ {
        // System error, probably due to a bug (AssertionError).
        // Show the full stack trace.
        console.error(err.stack)
      }
      log.verbose(`exitCode = ${exitCode}`)
    }
    // Pass through. Do not call exit(), to allow callbacks (or REPL) to run.
    return exitCode
  }

  static getProgramName (): string {
    // To differentiate between multiple invocations with different
    // names, extract the name from the last path element; ignore
    // extensions, if any.

    const argv1 = process.argv[1]?.trim()
    assert(argv1 !== undefined, 'Mandatory argv[1]')

    const fileName: string = path.basename(argv1)
    let programName
    if (fileName.indexOf('.') !== undefined) {
      programName = fileName.split('.')[0]?.trim()
    } else {
      programName = fileName?.trim()
    }
    assert(programName !== undefined && programName.length > 0,
      'Mandatory program name')

    return programName
  }

  // --------------------------------------------------------------------------

  public context: Context
  public options: Options

  protected latestVersionPromise: Promise<string> | undefined = undefined
  protected commandsTree: CommandsTree = new CommandsTree()

  /**
   * @summary Constructor, to remember the context.
   *
   * @param context Reference to a context.
   */
  constructor (context: Context) {
    assert(context)
    assert(context.console)
    assert(context.log)
    assert(context.config)

    this.context = context
    const log = this.context.log

    log.trace(`${this.constructor.name}.constructor()`)

    this.options = new Options({ context })

    this.initializeCommonOptions()
  }

  initializeCommonOptions (): void {
    // ------------------------------------------------------------------------
    // Initialise the common options, that apply to all commands,
    // like options to set logger level, to display help, etc.
    this.options.addGroups(
      [
        {
          title: 'Common options',
          isCommon: true,
          optionsDefinitions: [
            {
              options: ['-h', '--help'],
              init: (context) => {
                context.config.isHelpRequest = false
              },
              action: (context) => {
                context.config.isHelpRequest = true
              },
              isOptional: true,
              isHelp: true
            },
            {
              options: ['--version'],
              message: 'Show version',
              init: (context) => {
                context.config.isVersionRequest = false
              },
              action: (context) => {
                context.config.isVersionRequest = true
              },
              isOptional: true,
              isRequiredEarly: true
            },
            {
              options: ['--loglevel'],
              message: 'Set log level',
              init: (context) => {
                context.config.logLevel = defaultLogLevel
              },
              action: (context, val) => {
                assert(val !== undefined)
                context.config.logLevel = val as LogLevel
              },
              isOptional: true,
              values: ['silent', 'warn', 'info', 'verbose', 'debug', 'trace'],
              param: 'level'
            },
            {
              options: ['-s', '--silent'],
              message: 'Disable all messages (--loglevel silent)',
              init: () => { },
              action: (context) => {
                context.config.logLevel = 'silent'
              },
              isOptional: true
            },
            {
              options: ['-q', '--quiet'],
              message: 'Mostly quiet, warnings and errors (--loglevel warn)',
              init: () => { },
              action: (context) => {
                context.config.logLevel = 'warn'
              },
              isOptional: true
            },
            {
              options: ['--informative'],
              message: 'Informative (--loglevel info)',
              init: () => { },
              action: (context) => {
                context.config.logLevel = 'info'
              },
              isOptional: true
            },
            {
              options: ['-v', '--verbose'],
              message: 'Verbose (--loglevel verbose)',
              init: () => { },
              action: (context) => {
                context.config.logLevel = 'verbose'
              },
              isOptional: true
            },
            {
              options: ['-d', '--debug'],
              message: 'Debug messages (--loglevel debug)',
              init: () => { },
              action: (context) => {
                const config = context.config
                if (config.logLevel === 'debug') {
                  config.logLevel = 'trace'
                } else {
                  config.logLevel = 'debug'
                }
              },
              isOptional: true
            },
            {
              options: ['-dd', '--trace'],
              message: 'Trace messages (--loglevel trace, -d -d)',
              init: () => { },
              action: (context) => {
                context.config.logLevel = 'trace'
              },
              isOptional: true
            },
            {
              options: ['--no-update-notifier'],
              message: 'Skip check for a more recent version',
              init: () => { },
              action: (context) => {
                context.config.noUpdateNotifier = true
              },
              isOptional: true
            },
            {
              options: ['-C'],
              message: 'Set current folder',
              init: (context) => {
                context.config.cwd = context.processCwd
              },
              action: (context, val) => {
                assert(val !== undefined)
                const config = context.config
                if (path.isAbsolute(val)) {
                  config.cwd = val
                } else if (config.cwd !== undefined) {
                  config.cwd = path.resolve(config.cwd, val)
                } else /* istanbul ignore next */ {
                  config.cwd = path.resolve(val)
                }
                context.log.debug(`set cwd: '${config.cwd}'`)
              },
              isOptional: true,
              param: 'folder'
            }
          ]
        }
      ]
    )
  }

  initializeReplOptions (): void {
    const context = this.context
    if (context.enableREPL !== undefined && context.enableREPL) {
      this.options.appendToGroup('Common options',
        [
          {
            options: ['--interactive-server-port'],
            init: (context) => {
              context.config.interactiveServerPort = undefined
            },
            action: (context, val) => /* istanbul ignore next */ {
              context.config.interactiveServerPort = +val // as number
            },
            isOptional: true,
            hasValue: true,
            isRequiredEarly: true
          }
        ]
      )
    }
  }

  /**
   * @summary Application instance runner.
   *
   * @returns The process exit code.
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
   * On POSIX, it is 'node' or possibly the full path (not very interesting).
   * On Windows, it is the node full path (not interesting as well).
   *
   * `process.argv[0]` - the node full path.
   * On macOS it looks like `/Users/ilg/.nvm/versions/node/v18.14.0/bin/node`
   * On Ubuntu it looks like `/home/ilg/.nvm/versions/node/v18.14.2/bin/node`
   * On Windows it looks like `C:\Program Files\nodejs\node.exe`.
   *
   * `process.argv[1]` - the full path of the invoking script.
   * On macOS it is either `/usr/local/bin/xyz` or `.../bin/xyz.js`.
   * On Ubuntu it is either `/usr/bin/xyz` or `.../bin/xyz.js`.
   * On Windows, it is a path inside the `AppData` folder
   * like `C:\Users\ilg\AppData\Roaming\npm\node_modules\xyz\bin\xyz.js`
   *
   * To call a program with different names, create multiple
   * executable scripts in the `bin` folder and by processing
   * `argv[1]` it is possible to differentiate between them.
   *
   * The communication with the actual CLI implementation is done via
   * the context object, which includes a logger, a configuration
   * object and a few more properties.
   */
  async prepareAndRun (): Promise<number> {
    const context = this.context
    const config = context.config
    const log = context.log

    // Set the application name, to make `ps` output more readable.
    // https://nodejs.org/docs/latest-v14.x/api/process.html#process_process_title
    process.title = context.programName

    // ------------------------------------------------------------------------
    // Read package.json in.

    assert(context.rootPath)
    context.packageJson =
      await readPackageJson(context.rootPath)

    const packageJson = context.packageJson

    // ------------------------------------------------------------------------
    // Validate the engine.

    const nodeVersion = process.version // v14.21.2
    const engines: string = packageJson.engines?.node ??
      ' >=16.0.0'
    if (!semver.satisfies(nodeVersion, engines)) {
      console.error(`Please use a newer node (at least ${engines}).\n`)
      return ExitCodes.ERROR.PREREQUISITES
    }

    // ------------------------------------------------------------------------

    // These are early messages, not shown immediately,
    // they are delayed until the log level is known.
    if (packageJson?.description !== undefined) {
      log.verbose(`${packageJson.description}`)
    }
    log.debug(`argv0: ${process?.argv[1] ?? 'undefined'}`)

    process.argv.forEach((arg, index) => {
      log.debug(`start arg${index}: '${arg}'`)
    })

    this.initializeReplOptions()

    // Call the init() function of all defined options.
    this.options.initializeConfiguration()

    // Skip the first two arguments (the node path and the application path).
    const argv = process.argv.slice(2)

    // Parse the common options, for example the log level, and update
    // the configuration, to know the log level, or if version/help.
    this.options.parse(argv)

    // After parsing the options, the debug level is finally known,
    // and the buffered messages are passed out.
    log.level = config.logLevel

    log.trace(util.inspect(config))

    // ------------------------------------------------------------------------

    // Very early detection of `--version`, since it makes
    // all other irrelevant. Checked again in dispatchCommands() for REPL.
    if (config.isVersionRequest !== undefined && config.isVersionRequest) {
      log.always(packageJson.version)
      return ExitCodes.SUCCESS
    }

    // ------------------------------------------------------------------------

    // Copy relevant args to local array.
    // Start with 0, possibly end with `--`.
    const mainArgs = this.options.filterOwnArguments(argv)

    // Isolate commands as words with letters and inner dashes.
    // First non word (probably option) ends the list.
    const commands: string[] = []
    if (this.commandsTree.hasCommands()) {
      for (const arg of mainArgs) {
        const lowerCaseArg = arg.toLowerCase()
        if (lowerCaseArg.match(/^[a-z][a-z-]*/) != null) {
          commands.push(lowerCaseArg)
        } else {
          break
        }
      }
    }

    // ------------------------------------------------------------------------

    // If no commands and -h, output the application help message.
    if ((commands.length === 0) &&
      (config.isHelpRequest !== undefined && config.isHelpRequest)) {
      this.outputHelp()
      return ExitCodes.SUCCESS // Help explicitly called.
    }

    // ------------------------------------------------------------------------

    let exitCode = ExitCodes.SUCCESS

    if ((commands.length === 0) && context.enableREPL) {
      // If there are no commands on the command line and REPL is enabled,
      // enter the loop. Each line will be evaluated with dispatchCommands().
      exitCode = await this.enterRepl()
      // The exit code at this point reflects only the
      // initial command, later commands will all set the exit code,
      // and the last one will be returned. (probably not very useful)
    } else {
      // For regular invocations, also check if an update is available.
      // Create on instance of notifier class, configured for the
      // current package.
      const updateChecker = new UpdateChecker({
        log,
        packageName: packageJson.name,
        packageVersion: packageJson.version
      })

      // Start the update checker, as an asynchronous function
      // running in parallel.
      await updateChecker.initiateVersionRetrieval()

      exitCode = await this.dispatchCommands(argv)

      // Before returning, possibly send a notification to the console.
      await updateChecker.notifyIfUpdateIsAvailable()

      log.verbose(`run() returns ${exitCode}`)
    }

    // ------------------------------------------------------------------------

    return exitCode
  }

  // https://nodejs.org/docs/latest-v14.x/api/repl.html
  // Use the node REPL (Read-Eval-Print-Loop)
  // to get a shell like prompt to enter sequences of commands.
  // Be sure `exit()` is called only on the `close()` event, otherwise
  // it'll abruptly terminate the process and prevent REPL usage, which
  // is inherently asynchronous.
  async enterRepl (): Promise<number> {
    const ClassThis = this.constructor as typeof Application

    const context = this.context
    const config = context.config
    const log = context.log
    const packageJson = context.packageJson

    const replTitle = context.packageJson.description ?? context.programName
    const exitCode = ExitCodes.SUCCESS

    const serverPort = config.interactiveServerPort
    if (serverPort === undefined) {
      // Terminal mode REPL.
      process.stdout.write(`\n${replTitle} REPL\n`)
      process.stdout.write('(use .exit to quit)\n')

      const terminalReplServer = repl.start({
        prompt: context.programName + '> ',
        input: process.stdin,
        output: process.stdout,
        eval: this.evaluateRepl.bind(this) as
          unknown as repl.REPLEval
      })

      terminalReplServer.on('exit', () => {
        process.exit(process.exitCode)
      })
      // Pass through to allow REPL to run...
    } else /* istanbul ignore next */ {
      // --------------------------------------------------------------------
      // TCP/IP socket REPL.

      // Useful during development, to test if everything goes to the
      // correct stream.

      console.log(`Listening on localhost:${serverPort}...`)

      // https://nodejs.org/docs/latest-v14.x/api/net.html#net_net_createserver_options_connectionlistener
      const server = net.createServer((socket) => {
        // 'connection' listener.
        // Called when someone connects to the server.
        const socketAddress = socket.address() as net.AddressInfo
        console.log(`Connection from ${socketAddress.address} opened`)

        socket.on('end', () => {
          console.log(`Connection from ${socketAddress.address} closed`)
        })

        socket.write(`\n${replTitle} REPL\n`)
        socket.write('(use .exit to quit)\n')

        const socketConsole = new Console({
          stdout: socket,
          stderr: socket
        })

        const socketLog = new Logger({
          console: socketConsole
        })

        // Propagate the log level from the terminal to the socket.
        socketLog.level = log.level

        // Create the application context.
        const socketContext = new Context({
          programName: context.programName,
          log: socketLog,
          console: socketLog.console
        })

        // Instantiate the derived class.
        const application = new ClassThis(socketContext)

        assert(socketContext.rootPath)
        // 'borrow' the package json from the terminal instance.
        socketContext.packageJson = packageJson

        const socketReplServer = repl.start({
          prompt: context.programName + '> ',
          input: socket,
          output: socket,
          eval: this.evaluateRepl.bind(application) as
            unknown as repl.REPLEval
        })

        socketReplServer.on('error', (err: any) => {
          throw err
        })

        socketReplServer.on('exit', () => {
          // console.log('Connection closed')
          socket.end()
        })
      })

      server.on('error', (err: any) => {
        throw err
      })

      server.on('close', () => {
        console.log('Socket closed')
        process.exit(process.exitCode)
      })

      // The code enters listen mode and returns, it does not wait for
      // anything, connections are accepted asynchronously.
      server.listen(serverPort)

      // Pass through to allow REPL to run...
    }
    return exitCode
  }

  // --------------------------------------------------------------------------

  /**
   * @summary Callback used by REPL when a line is entered.
   *
   * @param evalCmd The entire line, unparsed.
   * @param context Reference to a context.
   * @param _filename The name of the file.
   * @param callback Called on completion or error.
   * @returns Nothing
   *
   * @description
   * The function is passed to REPL with `.bind(application)`, so it'll
   * always have access to all instance properties.
   *
   * An eval function can error with repl.Recoverable to indicate the input
   * was incomplete and prompt for additional lines.
   */
  async evaluateRepl (
    evalCmd: string,
    _context: vm.Context,
    _filename: string,
    callback: nodeReplCallback
  ): Promise<void> {
    // `this` is bound to the application class.
    const context = this.context
    const log = context.log

    // Catch errors, this is an old style callback.
    try {
      // Split command line and remove any number of spaces.
      const argv = evalCmd.trim().split(/\s+/)

      const exitCode = await this.dispatchCommands(argv)
      log.verbose(`exit(${exitCode})`)

      // The last executed command exit code is passed as process exit code.
      process.exitCode = exitCode

      // Success, but do not return any value, since REPL thinks it
      // is a string that must be displayed.
      callback(null)
    } catch (err: any) /* istanbul ignore next */ {
      // Failure, will display `Error: ${ex.message}`.
      callback(err)
    }
  }

  // --------------------------------------------------------------------------

  /**
   * @summary Display the application help page.
   *
   * @returns Nothing.
   *
   * @description
   * Override it in the application if custom content is desired.
   */
  outputHelp (): void {
    const context = this.context

    const log = context.log
    log.trace(`${this.constructor.name}.help()`)

    const help = new Help({ context, options: this.options })

    // If there is a command, we should not get here, but in the command help.
    assert(context.commandInstance === undefined)

    const packageJson = this.context.packageJson
    const commands = this.commandsTree.getUnaliasedCommands()

    // Show top (application) help.

    help.outputAll({
      object: this,
      title: packageJson.description,
      commands
    })
  }

  /**
   * @summary Output details about extra args.
   *
   * @param _multiPass Status for two pass.
   * @returns Nothing.
   *
   * @description
   * The default implementation does nothing. Override it in
   * the application if needed.
   */
  outputHelpArgsDetails (_multiPass: MultiPass): void {
    // Nothing.
  }

  // --------------------------------------------------------------------------

  /**
   * @summary Dispatch commands to their implementations.
   *
   * @param argv Arguments array.
   * @returns The exit code.
   *
   * @description
   * Identify the command, find it's implementation and instantiate it.
   *
   * Called both from the top runner, or from REPL.
   */
  async dispatchCommands (argv: string[]): Promise<number> {
    const context = this.context
    const packageJson = context.packageJson

    context.startTime = Date.now()

    const log = context.log
    log.trace(`${this.constructor.name}.main()`)

    const config = context.config

    argv.forEach((arg, index) => {
      log.trace(`main arg${index}: '${arg}'`)
    })

    const remainingArgs = this.options.parse(argv)

    // After parsing the options, the debug level is finally known.
    log.level = config.logLevel

    log.trace(util.inspect(context.config))

    // Done again here, for REPL invocations.
    if (config.isVersionRequest !== undefined && config.isVersionRequest) {
      log.always(packageJson.version)
      return ExitCodes.SUCCESS
    }

    // Copy relevant args to local array.
    // Start with 0, possibly end with `--`.
    const mainArgs = this.options.filterOwnArguments(argv)

    // Isolate commands as words with letters and inner dashes.
    // First non word (probably option) ends the list.
    const commands: string[] = []
    if (this.commandsTree.hasCommands()) {
      for (const arg of mainArgs) {
        const lowerCaseArg = arg.toLowerCase()
        if (lowerCaseArg.match(/^[a-z][a-z-]*/) != null) {
          commands.push(lowerCaseArg)
        } else {
          break
        }
      }
    }

    // Save the commands in the context, for possible later use, since
    // they are skipped when calling the command implementation.
    context.commands = commands

    // If --help and no command, output the application help message.
    if ((commands.length === 0) &&
      (config.isHelpRequest !== undefined && config.isHelpRequest)) {
      this.outputHelp()
      return ExitCodes.SUCCESS // Help explicitly called.
    }

    await makeDir(config.cwd)
    // This global setting makes running multiple applications
    // in a server impossible.
    process.chdir(config.cwd)
    log.debug(`cwd()='${process.cwd()}'`)

    let exitCode: number = ExitCodes.SUCCESS
    try {
      // The complex application, with multiple commands.
      if (this.commandsTree.hasCommands()) {
        if (commands.length === 0) {
          log.error('Missing mandatory command.')
          this.outputHelp()
          return ExitCodes.ERROR.SYNTAX // No commands.
        }

        // Throws not supported or not unique.
        const found: FoundCommandModule = this.commandsTree.findCommandModule(
          commands)

        assert(context.rootPath)
        // Throws an assert if there is no command class.
        const CommandClass = await this.findCommandClass(
          context.rootPath,
          found.moduleRelativePath
        )

        context.CommandClass = CommandClass
        // The command class is known at this point.

        // Full name commands, not the actual encountered shortcuts.
        context.fullCommands = found.matchedCommands

        log.debug(`Command(s): '${context.fullCommands.join(' ')}'`)

        // Use the original array, since we might have `--` options,
        // and skip already processed commands.
        const commandArgs = remainingArgs.slice(commands.length -
          found.unusedCommands.length)
        commandArgs.forEach((arg, index) => {
          log.trace(`cmd arg${index}: '${arg}'`)
        })

        const commandInstance: Command = new CommandClass(this)
        context.commandInstance = commandInstance

        if (config.isHelpRequest !== undefined && config.isHelpRequest) {
          assert(context.CommandClass)
          // Show the command specific help.
          commandInstance.outputHelp()
          return ExitCodes.SUCCESS // Help explicitly called.
        }

        log.debug(`'${context.programName} ` +
          `${context.fullCommands.join(' ')}' started`)

        exitCode = await commandInstance.prepareAndRun(commandArgs)
        log.debug(`'${context.programName} ` +
          `${context.fullCommands.join(' ')}' - returned ${exitCode}`)
      } else {
        // There are no sub-commands, there should be only one main().
        if (config.isHelpRequest !== undefined && config.isHelpRequest) {
          // Show the top (application) help.
          this.outputHelp()
          return ExitCodes.SUCCESS // Help explicitly called.
        }

        log.debug(`'${context.programName}' started`)

        exitCode = await this.run(remainingArgs)
        log.debug(`'${context.programName}' - returned ${exitCode}`)
      }
    } catch (err) {
      exitCode = ExitCodes.ERROR.APPLICATION
      if (err instanceof cli.SyntaxError) {
        // CLI triggered error. Treat it gently and try to be helpful.
        log.error(err.message)
        this.outputHelp()
        exitCode = err.exitCode
      } else if (err instanceof cli.Error) {
        // Other CLI triggered error. Treat it gently.
        log.error(err.message)
        exitCode = err.exitCode
      } else {
        // System error, probably due to a bug (AssertionError).
        // Show the full stack trace.
        log.error((err as Error).stack)
      }
      log.verbose(`exit(${exitCode})`)
    }

    context.commands = []
    context.CommandClass = undefined
    context.commandInstance = undefined

    return exitCode
  }

  // Search for classes derived from cli.Command.
  async findCommandClass (
    rootPath: string,
    moduleRelativePath: string
  ): Promise<any> {
    const parentClass = Command

    const modulePath = path.join(rootPath, moduleRelativePath)

    // On Windows, absolute paths start with a drive letter, and the
    // explicit `file://` is mandatory.
    const moduleExports = await import(`file://${modulePath.toString()}`)

    // Return the first exported class derived from parent
    // class (`cli.Command`).
    for (const property in moduleExports) {
      const obj = moduleExports[property]
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (Object.prototype.isPrototypeOf.call(parentClass, obj)) {
        return moduleExports[property]
      }
    }
    // Module not found
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    assert(false, `A class derived from '${parentClass.name}' not ` +
      `found in '${modulePath}'.`)
  }

  async run (_args: string[]): Promise<number> {
    assert(false, 'For applications that do not have sub-commands, ' +
      'define a run() method in the cli.Application derived class')
  }
}

// ----------------------------------------------------------------------------Â
