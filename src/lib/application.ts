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
import * as nonStrictAssert from 'node:assert'

import { Console } from 'node:console'
import * as net from 'node:net'
import * as os from 'node:os'
import * as path from 'node:path'
// import * as process from 'node:process'
import * as readline from 'node:readline'
import * as repl from 'node:repl'
import * as util from 'node:util'
import { fileURLToPath } from 'node:url'
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

import {
  Command,
  CommandConstructorParams,
  DerivedCommand
} from './command.js'
import {
  CommandsTree,
  FoundCommandModule
} from './commands-tree.js'
import { Configuration, defaultLogLevel } from './configuration.js'
import { Context } from './context.js'
import { ExitCodes } from './error.js'
// Hack to keep the cli.Error notation consistent.
import * as cli from './error.js'
import { Options, OptionsGroup } from './options.js'
import { NpmPackageJson, readPackageJson } from './utils.js'

// ----------------------------------------------------------------------------
// Logger level configuration options.
//
// `-s`, `--silent`: `--loglevel silent` (not even errors)
// `-q`, `--quiet`: `--loglevel warn` (errors and warnings)
// `--informative --loglevel info` (default)
// `-v`, `--verbose`: `--loglevel verbose`
// `-d`, '--debug': `--loglevel debug`
// `-dd`, '--trace': `--loglevel trace`

// ----------------------------------------------------------------------------
// Exit codes:
//
// - 0 = Ok
// - 1 = Syntax error
// - 2 = Application error
// - 3 = Input error (no file, wrong format, etc)
// - 4 = Output error (cannot create file, cannot write, etc)
// - 5 = Child return error
// - 6 = Prerequisites (like node version)
// - 7 = Mismatched type, usually in configurations error

// ----------------------------------------------------------------------------

/**
 * @summary Node.js REPL callback.
 *
 * @callback nodeReplCallback
 */
type nodeReplCallback = (
  error?: null | Error,
  result?: readline.CompleterResult
) => void

const commonOptions: OptionsGroup[] = [
  {
    description: 'Common options',
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
        helpDefinitions: {
          description: 'Quick help',
          isHelp: true
        }
      },
      {
        options: ['--version'],
        init: (context) => {
          context.config.isVersionRequest = false
        },
        action: (context) => {
          context.config.isVersionRequest = true
        },
        helpDefinitions: {
          description: 'Show version',
          isRequiredEarly: true
        }
      },
      {
        options: ['--loglevel'],
        init: (context) => {
          context.config.logLevel = defaultLogLevel
        },
        action: (context, val) => {
          assert(val !== undefined)
          context.config.logLevel = val as LogLevel
        },
        hasValue: true,
        values: ['silent', 'warn', 'info', 'verbose', 'debug', 'trace'],
        helpDefinitions: {
          description: 'Set log level',
          valueDescription: 'level'
        }
      },
      {
        options: ['-s', '--silent'],
        init: () => { },
        action: (context) => {
          context.config.logLevel = 'silent'
        },
        helpDefinitions: {
          description: 'Disable all messages (--loglevel silent)'
        }
      },
      {
        options: ['-q', '--quiet'],
        init: () => { },
        action: (context) => {
          context.config.logLevel = 'warn'
        },
        helpDefinitions: {
          description: 'Mostly quiet, warnings and errors' +
            ' (--loglevel warn)'
        }
      },
      {
        options: ['--informative'],
        init: () => { },
        action: (context) => {
          context.config.logLevel = 'info'
        },
        helpDefinitions: {
          description: 'Informative (--loglevel info)'
        }
      },
      {
        options: ['-v', '--verbose'],
        init: () => { },
        action: (context) => {
          context.config.logLevel = 'verbose'
        },
        helpDefinitions: {
          description: 'Verbose (--loglevel verbose)'
        }
      },
      {
        options: ['-d', '--debug'],
        init: () => { },
        action: (context) => {
          const config: Configuration = context.config
          if (config.logLevel === 'debug') {
            // When used two times (`-d` `-d`) increase log level
            config.logLevel = 'trace'
          } else {
            config.logLevel = 'debug'
          }
        },
        helpDefinitions: {
          description: 'Debug messages (--loglevel debug)'
        }
      },
      {
        options: ['-dd', '--trace'],
        init: () => { },
        action: (context) => {
          context.config.logLevel = 'trace'
        },
        helpDefinitions: {
          description: 'Trace messages (--loglevel trace, -d -d)'
        }
      },
      {
        options: ['--no-update-notifier'],
        init: () => { },
        action: (context) => {
          context.config.noUpdateNotifier = true
        },
        helpDefinitions: {
          description: 'Skip check for a more recent version'
        }
      },
      {
        options: ['-C'],
        init: (context) => {
          context.config.cwd = context.processCwd
        },
        action: (context, val) => {
          assert(val !== undefined)
          const config: Configuration = context.config
          // When multiple -C options are given, each subsequent
          // non-absolute -C <path> is interpreted relative to the
          // preceding -C <path>.
          if (path.isAbsolute(val)) {
            config.cwd = path.resolve(val)
          } else {
            config.cwd = path.resolve(config.cwd, val)
          }
          context.log.debug(`set cwd='${config.cwd}'`)
        },
        hasValue: true,
        helpDefinitions: {
          description: 'Set current folder',
          valueDescription: 'folder'
        }
      }
    ]
  }
]

const commonOptionsRepl: OptionsGroup[] = [
  {
    description: 'Common options',
    isCommon: true,
    isInsertInFront: true,
    optionsDefinitions: [
      {
        options: ['--interactive-server-port'],
        /* c8 ignore start */
        init: (context) => {
          context.config.interactiveServerPort = undefined
        },
        action: (context, val) => /* istanbul ignore next */ {
          context.config.interactiveServerPort = +val // as number
        },
        /* c8 ignore stop */
        hasValue: true,
        helpDefinitions: {
          isRequiredEarly: true
        }
      }
    ]
  }
]

// ============================================================================

export interface ApplicationConstructorParams
  extends CommandConstructorParams {
}

/**
 * @summary Base class for a CLI application.
 *
 * @description
 * Normally there is only one instance of this class, but when a
 * socket REPL is used, multiple instances can be created for multiple
 * net clients, a good reason for not using static variables.
 *
 */
export class Application extends Command {
  // --------------------------------------------------------------------------
  // For convenience, use a static method to create the instance and
  // bootstrap everything.

  /**
   * @summary Application start().
   *
   * @returns A number with the process exit code.
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
  static async start (params?: {
    context?: Context
  }): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const DerivedApplicationClass = this // Simply to make it look like a class.

    // Create the log early, to have it in the exception handlers.
    const log: Logger = params?.context?.log ?? new Logger({ console })

    let exitCode: number = ExitCodes.SUCCESS
    try {
      const context: Context = params?.context ?? new Context({ log })

      // Instantiate the derived class.
      const application = new DerivedApplicationClass({
        context
      })

      // The rootPath (required to read the package.json) is known
      // only after the instance is created. Make sure it is defined.
      assert(application.context.rootPath,
        'The derived Application must define the rootPath')

      // Redirect to the instance runner. It might start a REPL.
      exitCode = await application.start()

      log.trace(`Application.start() returned ${exitCode}`)
    } catch (error: any) {
      exitCode = this.processStartError({ error, log })
    }
    // Pass through. Do not call exit(), to allow callbacks (or REPL) to run.
    return exitCode
  }

  static processStartError (params: {
    error: any
    log: Logger
  }): number {
    assert(params, 'params')
    assert(params.error, 'params.error')
    assert(params.log, 'params.log')

    const error = params.error
    const log: Logger = params.log

    let exitCode: number = ExitCodes.ERROR.APPLICATION

    // If the initialisation was completed, the log level must have been
    // set, but for early quits the level might still be undefined.
    if (!log.hasLevel) {
      log.level = defaultLogLevel
      // This is the moment when buffered logs are written out.
    }

    // Be sure the AssertionError is the same, regardless the namespace,
    // so that further tests do not need to check both.
    assert(assert.AssertionError === nonStrictAssert.AssertionError,
      'non-unique AssertionError')

    if (error instanceof assert.AssertionError) {
      // Rethrow assertion errors; they happen only during development
      // and are checked by tests.
      throw error
    } else if (error instanceof cli.Error) {
      // CLI triggered error. Treat it gently.
      if (error.message !== undefined) {
        log.error(error.message)
      }
      exitCode = error.exitCode
    } else {
      // System error, probably due to a bug.
      // Show the full stack trace.
      log.console.error(error)
    }
    log.debug(`exitCode: ${exitCode}`)

    return exitCode
  }

  // --------------------------------------------------------------------------
  // Configurable in the derived Application class.

  // MAY BE set, to enable REPL mode.
  protected enableREPL: boolean = false

  // MAY BE set, to enable the update checker.
  protected checkUpdatesIntervalSeconds: number = 24 * 60 * 60

  // --------------------------------------------------------------------------

  protected latestVersionPromise: Promise<string> | undefined = undefined
  protected commandsTree: CommandsTree

  // --------------------------------------------------------------------------

  /**
   * @summary Constructor, to remember the context.
   *
   * @param context Reference to a context.
   */
  constructor (params: ApplicationConstructorParams) {
    super(params)

    const context: Context = this.context

    const log: Logger = context.log
    log.trace('Application.constructor()')

    this.commandsTree = new CommandsTree({ context })

    this.initializeCommonOptions()
  }

  /**
   * @summary Initialise common options.
   */
  initializeCommonOptions (): void {
    const context: Context = this.context

    // Initialise the common options, that apply to all commands,
    // like options to set logger level, to display help, etc.
    context.options.addGroups(commonOptions)
  }

  /**
   * @summary Initialise REPL options.
   */
  initializeReplOptions (): void {
    const context: Context = this.context

    /* c8 ignore start */
    if (this.enableREPL) {
      context.options.appendToGroups(commonOptionsRepl)
    }
    /* c8 ignore stop */
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
  async start (): Promise<number> {
    const context: Context = this.context

    const log: Logger = context.log
    const config: Configuration = context.config

    // Set the application name, to make `ps` output more readable.
    // https://nodejs.org/docs/latest-v14.x/api/process.html#process_process_title
    process.title = context.programName

    // ------------------------------------------------------------------------
    // Read package.json in.

    assert(context.rootPath, 'context.rootPath')
    try {
      context.packageJson = await readPackageJson(context.rootPath)
    } catch (error: any) {
      // During tests the file might not be available.
      log.debug(error)
    }

    const packageJson: NpmPackageJson = context.packageJson

    // The package.json file must define at least the name and the version.
    assert(packageJson.name, 'packageJson.name')
    assert(packageJson.version, 'packageJson.version')

    this.commandsTree.setHelpDescription(
      packageJson.description ?? packageJson.name)

    // ------------------------------------------------------------------------
    // Validate the engine.

    if (!this.validateEngine(packageJson)) {
      return ExitCodes.ERROR.PREREQUISITES
    }

    // ------------------------------------------------------------------------

    // These are early messages, not shown immediately,
    // they are delayed until the log level is known.
    if (packageJson?.description !== undefined) {
      log.debug(`${packageJson.description}`)
    }

    // Log os, node and arguments.
    this.logInitialDebug(packageJson)

    // ------------------------------------------------------------------------

    this.initializeReplOptions()

    // For use in Help.
    context.commandNode = this.commandsTree

    const options: Options = this.context.options

    // ------------------------------------------------------------------------

    // Skip the first two arguments (the node path and the application path).
    const argv = context.processArgv.slice(2)

    // Parse the common options, for example the log level, and update
    // the configuration, to know the log level, or if version/help.
    options.parse(argv)

    // After parsing the options, the debug level is finally known,
    // and the buffered messages are passed out.
    log.level = config.logLevel

    log.trace(util.inspect(config))

    // ------------------------------------------------------------------------

    // Very early detection of `--version`, since it makes
    // all other irrelevant. Checked again in dispatchCommands() for REPL.
    if (config.isVersionRequest ?? false) {
      log.always(packageJson.version)
      return ExitCodes.SUCCESS
    }

    // ------------------------------------------------------------------------

    // Isolate commands as words with letters and inner dashes.
    const commands: string[] = this.identifyCommands(argv)

    // ------------------------------------------------------------------------

    // If no commands and -h, output the application help message.
    if ((commands.length === 0) && (config.isHelpRequest ?? false)) {
      this.outputHelp()
      return ExitCodes.SUCCESS // Help explicitly called.
    }

    // ------------------------------------------------------------------------

    let exitCode: number = ExitCodes.SUCCESS

    if ((commands.length === 0) && this.enableREPL) {
      /* c8 ignore start */
      // If there are no commands on the command line and REPL is enabled,
      // enter the loop. Each line will be evaluated with dispatchCommands().
      exitCode = await this.enterRepl()
      // The exit code at this point reflects only the
      // initial command, later commands will all set the exit code,
      // and the last one will be returned. (probably not very useful)
      /* c8 ignore stop */
    } else {
      if (config.noUpdateNotifier) {
        // Pass the original process arguments (without node & program path).
        exitCode = await this.dispatchCommand(argv)
      } else {
        // For regular invocations, also check if an update is available.
        // Create on instance of notifier class, configured for the
        // current package.
        const updateChecker = new UpdateChecker({
          log,
          packageName: packageJson.name,
          packageVersion: packageJson.version,
          checkUpdatesIntervalSeconds: this.checkUpdatesIntervalSeconds
        })

        // Start the update checker, as an asynchronous function
        // running in parallel.
        await updateChecker.initiateVersionRetrieval()

        // Pass the original process arguments (without node & program path).
        exitCode = await this.dispatchCommand(argv)

        // Before returning, possibly send a notification to the console.
        await updateChecker.notifyIfUpdateIsAvailable()
      }
    }
    // ------------------------------------------------------------------------

    return exitCode
  }

  /**
   * @summary Validate node engine.
   *
   * @param packageJson
   * @returns True if the version of node is acceptable.
   *
   * @description
   * Check the `engines` property in `package.json` and compare it
   * with the value reported by node itself.
   *
   * Use `semver` official syntax.
   */
  validateEngine (packageJson: NpmPackageJson): boolean {
    const context: Context = this.context

    const log: Logger = context.log

    const nodeVersion = process.version // v14.21.2
    const engines: string = packageJson.engines?.node ??
      ' >=16.0.0'
    if (!semver.satisfies(nodeVersion, engines)) {
      log.console.error(
        `Please use a newer node (at least ${engines.trim()}).\n`)
      return false
    }
    return true
  }

  /**
   * @summary Log several initial debug messages.
   * @param packageJson The content of the project package.json.
   */
  logInitialDebug (packageJson: NpmPackageJson): void {
    const context: Context = this.context

    const log: Logger = context.log

    log.debug(`package: ${packageJson.name}@${packageJson.version}`)
    log.debug(`os arch: ${os.arch()}, platform: ${os.platform()},` +
      ` release: ${os.release()}`)
    log.debug(`node: ${process.version}`)

    log.debug(`process.argv0: ${process?.argv[0] ?? 'undefined'}`)
    log.debug(`process.argv1: ${process?.argv[1] ?? 'undefined'}`)

    context.processArgv.forEach((arg, index) => {
      log.debug(`start argv${index}: '${arg}'`)
    })
  }

  /**
   *
   * @param mainArgv
   * @returns Array of string with the commands
   *
   * @description
   * Isolate commands as words with letters and inner dashes.
   *
   * The first non word (probably option) ends the list.
   */
  identifyCommands (mainArgv: string[]): string[] {
    assert(mainArgv, 'mainArgv')

    const commands: string[] = []
    if (this.commandsTree.hasChildrenCommands()) {
      for (const arg of mainArgv) {
        const lowerCaseArg = arg.toLowerCase()
        if (lowerCaseArg.match(/^[a-z][a-z-]*/) != null) {
          commands.push(lowerCaseArg)
        } else {
          break
        }
      }
    }
    return commands
  }

  // https://nodejs.org/docs/latest-v14.x/api/repl.html
  // Use the node REPL (Read-Eval-Print-Loop)
  // to get a shell like prompt to enter sequences of commands.
  // Be sure `exit()` is called only on the `close()` event, otherwise
  // it'll abruptly terminate the process and prevent REPL usage, which
  // is inherently asynchronous.
  /* c8 ignore start */
  async enterRepl (): Promise<number> {
    const context: Context = this.context

    const log: Logger = context.log
    const config: Configuration = context.config
    const packageJson: NpmPackageJson = context.packageJson

    const replTitle = context.packageJson.description ?? context.programName

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

        const socketContext = new Context({
          log: socketLog
        })

        const DerivedApplicationClass =
          this.constructor as typeof DerivedApplication

        // Instantiate the derived class.
        const application = new DerivedApplicationClass({
          context: socketContext
        })

        assert(application.context.rootPath, 'application.context.rootPath')
        // 'borrow' the package json from the terminal instance.
        application.context.packageJson = packageJson

        const socketReplServer = repl.start({
          prompt: context.programName + '> ',
          input: socket,
          output: socket,
          eval: this.evaluateRepl.bind(application) as
            unknown as repl.REPLEval
        })

        socketReplServer.on('error', (error: any) => {
          throw error
        })

        socketReplServer.on('exit', () => {
          // console.log('Connection closed')
          socket.end()
        })
      })

      server.on('error', (error: any) => {
        throw error
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
    return ExitCodes.SUCCESS
  }
  /* c8 ignore stop */

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
  /* c8 ignore start */
  async evaluateRepl (
    evalCmd: string,
    _context: vm.Context,
    _filename: string,
    callback: nodeReplCallback
  ): Promise<void> {
    // `this` is bound to the application class.
    const context: Context = this.context

    const log: Logger = context.log

    // Catch errors, this is an old style callback.
    try {
      // Split command line and remove any number of spaces.
      const argv: string[] = evalCmd.trim().split(/\s+/)

      const exitCode: number = await this.dispatchCommand(argv)
      log.debug(`exit(${exitCode})`)

      // The last executed command exit code is passed as process exit code.
      process.exitCode = exitCode

      // Success, but do not return any value, since REPL thinks it
      // is a string that must be displayed.
      callback(null)
    } catch (error: any) /* istanbul ignore next */ {
      // Failure, will display `Error: ${ex.message}`.
      callback(error)
    }
  }
  /* c8 ignore stop */

  // --------------------------------------------------------------------------

  /**
   * @summary Dispatch the command to its implementations.
   *
   * @param argv Arguments array.
   * @returns The exit code.
   *
   * @description
   * Identify the command, find it's implementation and instantiate it.
   *
   * Called both from the top runner, or from REPL.
   */
  async dispatchCommand (argv: string[]): Promise<number> {
    assert(argv, 'argv')

    const context: Context = this.context

    const log: Logger = context.log
    log.trace('Application.dispatchCommand()')

    context.startTimestampMilliseconds = Date.now()

    argv.forEach((arg, index) => {
      log.trace(`dispatchCommand argv${index}: '${arg}'`)
    })

    const config: Configuration = context.config

    // After parsing the options, the debug level is finally known.
    log.level = config.logLevel

    log.trace(util.inspect(context.config))

    const packageJson: NpmPackageJson = context.packageJson
    assert(packageJson.version, 'packageJson.version')

    // Done again here, for REPL invocations.
    /* c8 ignore start */
    if (config.isVersionRequest ?? false) {
      log.always(packageJson.version)
      return ExitCodes.SUCCESS
    }
    /* c8 ignore stop */

    // Isolate commands as words with letters and inner dashes.
    // First non word (probably option) ends the list.
    const commands: string[] = this.identifyCommands(argv)

    // // If --help and no command, output the application help message.
    // if ((commands.length === 0) &&
    //   (config.isHelpRequest ?? false)) {
    //   context.commandNode = this.commandsTree
    //   this.outputHelp()
    //   return ExitCodes.SUCCESS // Help explicitly called.
    // }

    // Warning: cannot change the global current folder in a server environment!
    // Normally the applications should not rely on this, instead explicitly
    // process relative paths and pass the config.cwd path to spawned processes.
    if (!(this.enableREPL && config.interactiveServerPort !== undefined)) {
      try {
        await makeDir(config.cwd)
        process.chdir(config.cwd)
        log.debug(`process.chdir('${process.cwd()}')`)
      } catch (error: any) {
        /* c8 ignore start */
        throw new cli.ApplicationError(
          `cannot change to '${config.cwd}' folder`)
      }
      /* c8 ignore stop */
    }

    let commandArgv: string[]
    let exitCode: number = ExitCodes.SUCCESS
    try {
      let commandInstance: DerivedCommand

      if (this.commandsTree.hasChildrenCommands()) {
        if (commands.length === 0) {
          context.commandNode = this.commandsTree
          if (config.isHelpRequest ?? false) {
            /* c8 ignore start */
            exitCode = ExitCodes.SUCCESS // Help explicitly called from REPL.
            /* c8 ignore stop */
          } else {
            log.error('missing mandatory <command>')
            exitCode = ExitCodes.ERROR.SYNTAX // No commands.
          }
          this.outputHelp()
          return exitCode
        }

        // For complex application, with multiple commands,
        // the command must be first identified and instantiated.
        commandInstance = await this.instantiateCommand({ commands })

        assert(commandInstance.context.commandNode)
        // Strip the first args used to identify the command
        commandArgv = argv.slice(commandInstance.context.commandNode.depth - 1)
      } else {
        // For simple applications, without sub-commands,
        // the command instance is exactly the application.
        commandInstance = this as DerivedCommand
        commandArgv = argv

        context.commandNode = this.commandsTree
      }

      exitCode = await commandInstance.prepareAndRun({
        argv: commandArgv
      })
    } catch (error: any) {
      exitCode = this.processCommandError({ error, log })
    }

    // Prevent spilling the current command into the next, in case of REPL.
    context.matchedCommands = []
    context.unparsedArgv = []
    context.ownArgv = []
    context.forwardableArgv = []

    return exitCode
  }

  // Similar to static processStartError(), but slightly different.
  processCommandError (params: {
    error: any
    log: Logger
  }): number {
    assert(params, 'params')
    assert(params.log, 'params.log')
    assert(params.log, 'params.log')

    const error: any = params.error
    const log: Logger = params.log

    let exitCode: number = ExitCodes.ERROR.APPLICATION

    if (error instanceof assert.AssertionError) {
      // Rethrow assertion errors; they happen only during development
      // and tests check their messages; otherwise should not occur.
      throw error
    } else if (error instanceof cli.Error) {
      // CLI triggered error. Treat it gently.
      if (error.message?.length > 0) {
        log.error(error.message)
      }
      // For syntax errors display help.
      if (error.exitCode === ExitCodes.ERROR.SYNTAX) {
        this.outputHelp()
      }
      exitCode = error.exitCode
    } else {
      // System error, probably due to a bug.
      // Show the full stack trace.
      log.console.error(error)
    }
    log.debug(`exit(${exitCode})`)

    return exitCode
  }

  async instantiateCommand (params: {
    commands: string[]
  }): Promise<DerivedCommand> {
    assert(params, 'params')
    assert(params.commands, 'params.commands')

    const context: Context = this.context

    const log: Logger = context.log
    log.trace('Application.instantiateCommand()')

    // May throw 'not supported' or 'not unique'.
    const found: FoundCommandModule = this.commandsTree.findCommandModule(
      params.commands)

    assert(context.rootPath, 'context.rootPath')
    // Throws an assert if there is no command class.
    const DerivedCommandClass: typeof DerivedCommand =
      await this.findCommandClass({
        moduleRelativePath: found.moduleRelativePath,
        className: found.className
      })

    // Full name commands, not the actual encountered,
    // which may be shortcuts.
    context.matchedCommands = found.commandNode.getUnaliasedCommandParts()

    log.debug(`Command(s): '${context.matchedCommands.join(' ')}'`)

    // Create a new logger and copy the level from the application logger.
    const commandLog: Logger = new Logger({
      console: log.console
    })
    commandLog.level = log.level

    // The command context inherits most of the application context
    // properties.
    const commandContext: Context = new Context({
      log: commandLog,
      context
    })

    // Used by Help, to display aliases.
    commandContext.commandNode = found.commandNode

    const commandInstance: DerivedCommand = new DerivedCommandClass({
      context: commandContext
    })

    return commandInstance
  }

  async findCommandClass (params: {
    rootPath?: string
    moduleRelativePath: string
    className?: string | undefined
    parentClass?: typeof Command
  }): Promise<typeof DerivedCommand> {
    assert(params, 'params')
    assert(params.moduleRelativePath, 'params.moduleRelativePath')

    const context: Context = this.context

    const log: Logger = context.log

    const rootPath: string | undefined = params.rootPath ?? context.rootPath
    assert(rootPath, 'rootPath')

    const parentClass: typeof Command = params.parentClass ?? Command

    const modulePath: string = path.resolve(
      path.join(rootPath, params.moduleRelativePath))

    log.trace(`modulePath: ${modulePath}`)

    // On Windows, absolute paths start with a drive letter, and the
    // explicit `file://` is mandatory.
    const moduleExports: any = await import(`file://${modulePath.toString()}`)

    if (params.className !== undefined) {
      // Return the first exported class derived from parent
      // class (`cli.Command`).
      for (const property in moduleExports) {
        const object: any = moduleExports[property]
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (object.name === params.className) {
          if (Object.prototype.isPrototypeOf.call(parentClass, object)) {
            return moduleExports[property]
          }
          assert(false, `the class named '${params.className}' found in` +
            ` '${modulePath}' is not derived from  '${parentClass.name}'`)
        }
      }
      // Module not found
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      assert(false, `no class named '${params.className}'` +
        ` found in '${modulePath}'`)
    } else {
      // Return the first exported class derived from parent
      // class (`cli.Command`).
      for (const property in moduleExports) {
        const object = moduleExports[property]
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (Object.prototype.isPrototypeOf.call(parentClass, object)) {
          return moduleExports[property]
        }
      }
      // Module not found
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      assert(false, `no class derived from '${parentClass.name}'` +
        ` found in '${modulePath}'`)
    }
  }

  async main (
    _argv: string[],
    _forwardableArgv?: string[]
  ): Promise<number> {
    assert(false, 'applications that do not have sub-commands should' +
      ' define a main() method in the cli.Application derived class')
  }
}

// ----------------------------------------------------------------------------

/**
 * @summary Type of derived application classes.
 *
 * @description
 * Explicit definition to show how a user Application class should look
 * like, more specifically that should it also set a mandatory rootPath.
 *
 * It is also used to validate the call to instantiate the user class
 * in the Application class.
 */
export class DerivedApplication extends Application {
  constructor (params: ApplicationConstructorParams) {
    super(params)

    const context: Context = this.context

    // Mandatory, must be set here, since it computes
    // the root path as relative to the path of this file.

    // In real life, adjust the number of dirname() calls to
    // reach the project root, where package.json is located.
    context.rootPath =
      path.dirname(path.dirname(fileURLToPath(import.meta.url)))
  }

  override async main (
    _argv: string[],
    _forwardableArgv: string[]
  ): Promise<number> {
    return cli.ExitCodes.SUCCESS
  }
}

// ----------------------------------------------------------------------------Â
