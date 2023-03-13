/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/MIT/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * This file provides the CLI startup code. It prepares a context
 * and calls the module `main()` code.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as fs from 'node:fs'
import * as net from 'node:net'
import * as os from 'node:os'
import * as path from 'node:path'
// import * as process from 'node:process'
import * as readline from 'node:readline'
import * as repl from 'node:repl'
import { fileURLToPath } from 'node:url'
import * as util from 'node:util'
// import * as vm from 'node:vm'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/@xpack/logger
import { Logger, LogLevel } from '@xpack/logger'

// https://www.npmjs.com/package/latest-version
import latestVersion from 'latest-version'

// https://www.npmjs.com/package/semver
import * as semver from 'semver'

// https://www.npmjs.com/package/semver-diff
import semverDiff from 'semver-diff'

// https://www.npmjs.com/package/is-installed-globally
import isInstalledGlobally from 'is-installed-globally'

// https://www.npmjs.com/package/is-path-inside
// ES module with default
import isPathInside from 'is-path-inside'

// https://www.npmjs.com/package/is-ci
import isCi from 'is-ci'

// https://www.npmjs.com/package/make-dir
import makeDir from 'make-dir'

// https://www.npmjs.com/package/del
import { deleteAsync } from 'del'

// ----------------------------------------------------------------------------

// import { WscriptAvoider } from 'wscript-avoider'

import { CliCommand } from './cli-command.js'
import { CliContext, NpmPackageJson } from './cli-context.js'
// import { CliConfiguration } from './cli-configuration.js'
import { CliOptions, CliOptionFoundModule } from './cli-options.js'

import { CliHelp } from './cli-help.js'
import { CliExitCodes, CliError, CliErrorSyntax } from './cli-error.js'
import { Console } from 'node:console'
import { Context } from 'node:vm'

// ----------------------------------------------------------------------------

const fsPromises = fs.promises

// ----------------------------------------------------------------------------

const timestampsPath = path.join(os.homedir(), '.config', 'timestamps')
const timestampSuffix = '-update-check'

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
export class CliApplication {
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
    let exitCode = CliExitCodes.SUCCESS
    let application
    try {
      const programName = CliApplication.getProgramName()

      // Create the application context.
      const context = new CliContext({
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
      exitCode = CliExitCodes.ERROR.APPLICATION
      if (err instanceof CliError) {
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

  /**
   * @summary Read package JSON file.
   *
   * @param rootPath The absolute path of the package.
   * @returns The package definition, unmodified.
   * @throws Error from `fs.readFile()` or `JSON.parse()`.
   *
   * @description
   * By default, this function uses the package root path
   * stored in the class property during initialisation.
   * When called from tests, the path must be passed explicitly.
   */
  static async readPackageJson (rootPath: string): Promise<NpmPackageJson> {
    assert(rootPath)
    const filePath = path.join(rootPath, 'package.json')
    const fileContent = await fsPromises.readFile(filePath)
    assert(fileContent !== null)
    return JSON.parse(fileContent.toString())
  }

  // --------------------------------------------------------------------------

  public context: CliContext
  public latestVersionPromise: Promise<string> | undefined = undefined

  /**
   * @summary Constructor, to remember the context.
   *
   * @param context Reference to a context.
   */
  constructor (context: CliContext) {
    assert(context)
    assert(context.console)
    assert(context.log)
    assert(context.config)

    this.context = context
    const log = this.context.log

    log.trace(`${this.constructor.name}.constructor()`)

    CliOptions.initialise(context)
    this.initializeCommonOptions()
  }

  initializeCommonOptions (): void {
    // ------------------------------------------------------------------------
    // Initialise the common options, that apply to all commands,
    // like options to set logger level, to display help, etc.
    CliOptions.addOptionGroups(
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
                assert(val !== undefined)
                context.config.logLevel = val as LogLevel
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
              init: (context) => {
                context.config.cwd = context.processCwd
              },
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
      CliOptions.appendToOptionGroups('Common options',
        [
          {
            options: ['--interactive-server-port'],
            action: (context, val) => /* istanbul ignore next */ {
              context.config.interactiveServerPort = +val // as number
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
      await CliApplication.readPackageJson(context.rootPath)

    // ------------------------------------------------------------------------
    // Validate the engine.

    const nodeVersion = process.version // v14.21.2
    const engines: string = context.packageJson.engines?.node ??
      ' >=16.0.0'
    if (!semver.satisfies(nodeVersion, engines)) {
      console.error(`Please use a newer node (at least ${engines}).\n`)
      return CliExitCodes.ERROR.PREREQUISITES
    }

    // ------------------------------------------------------------------------

    // These are early messages, not shown immediately,
    // they are delayed until the log level is known.
    if (context.packageJson?.description !== undefined) {
      log.verbose(`${context.packageJson.description}`)
    }
    log.debug(`argv0: ${process?.argv[1] ?? 'undefined'}`)

    process.argv.forEach((arg, index) => {
      log.debug(`start arg${index}: '${arg}'`)
    })

    this.initializeReplOptions()

    // Call the init() function of all defined options.
    const optionGroups = CliOptions.getCommonOptionGroups()
    optionGroups.forEach((optionGroup) => {
      optionGroup.optionDefs.forEach((optionDef) => {
        optionDef.init(context)
      })
    })

    // Skip the first two arguments (the node path and the application path).
    const argv = process.argv.slice(2)

    // Parse the common options, for example the log level, and update
    // the configuration, to know the log level, or if version/help.
    CliOptions.parseOptions(argv, context)

    // After parsing the options, the debug level is finally known,
    // and the buffered messages are passed out.
    log.level = config.logLevel

    log.trace(util.inspect(config))

    // ------------------------------------------------------------------------

    // Very early detection of `--version`, since it makes
    // all other irrelevant. Checked again in dispatchCommands() for REPL.
    if (config.isVersionRequest !== undefined && config.isVersionRequest) {
      log.always(context.packageJson.version)
      return CliExitCodes.SUCCESS
    }

    // ------------------------------------------------------------------------

    // Copy relevant args to local array.
    // Start with 0, possibly end with `--`.
    const mainArgs = CliOptions.filterOwnArguments(argv)

    // Isolate commands as words with letters and inner dashes.
    // First non word (probably option) ends the list.
    const commands: string[] = []
    if (CliOptions.hasCommands()) {
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
      return CliExitCodes.SUCCESS // Help explicitly called.
    }

    // ------------------------------------------------------------------------

    let exitCode = CliExitCodes.SUCCESS

    if ((commands.length === 0) && context.enableREPL) {
      // If there are no commands on the command line and REPL is enabled,
      // enter the loop. Each line will be evaluated with dispatchCommands().
      exitCode = await this.enterRepl()
      // The exit code at this point reflects only the
      // initial command, later commands will all set the exit code,
      // and the last one will be returned. (probably not very useful)
    } else {
      // For regular invocations, also check if an update is available.
      let latestVersionPromise
      if (await this.getLatestVersion()) {
        // At this step only create the promise,
        // its result is checked before exit.
        latestVersionPromise = latestVersion(context.packageJson.name)
      }

      exitCode = await this.dispatchCommands(argv)

      if (latestVersionPromise !== undefined) {
        await this.checkUpdate(latestVersionPromise)
      }

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
    const ClassThis = this.constructor as typeof CliApplication

    const context = this.context
    const config = context.config
    const log = context.log

    const replTitle = context.packageJson.description ?? context.programName
    const exitCode = CliExitCodes.SUCCESS

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
        const socketContext = new CliContext({
          programName: context.programName,
          log: socketLog,
          console: socketLog.console
        })

        // Instantiate the derived class.
        const application = new ClassThis(socketContext)

        assert(socketContext.rootPath)
        // 'borrow' the package json from the terminal instance.
        socketContext.packageJson = context.packageJson

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
    _context: Context,
    _filename: string,
    callback: nodeReplCallback
  ): Promise<void> {
    // `this` is bound to the application class.
    const context = this.context
    const log = context.log

    // Catch errors, this is an old style callback.
    try {
      // Split command line and remove any number of spaces.
      const args = evalCmd.trim().split(/\s+/)

      const exitCode = await this.dispatchCommands(args)
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

    const help = new CliHelp(context)

    // If there is a command, we should not get here, but in the command help.
    assert(context.commandInstance === undefined)

    // Show top (application) help.

    const commands = CliOptions.getUnaliasedCommands()
    const optionGroups = CliOptions.getCommonOptionGroups()
    const description = undefined

    // Try to get a message from the first group.
    help.outputCommands(commands, description, optionGroups[0]?.title)

    // The special trick here is how to align the right column.
    // For this, two steps are needed, the first to compute the max
    // width of the first column, and the second to output the text.

    help.twoPassAlign(() => {
      help.outputOptionGroups(optionGroups)
      help.outputHelpDetails(optionGroups)
      help.outputEarlyDetails(optionGroups)
    })

    help.outputFooter()
  }

  // --------------------------------------------------------------------------

  async didIntervalExpire (deltaSeconds: number): Promise<boolean> {
    const context = this.context
    const log = context.log

    const fpath = path.join(timestampsPath, context.packageJson.name +
      timestampSuffix)
    try {
      const stats = await fsPromises.stat(fpath)
      if (stats.mtime !== undefined) {
        const crtDelta = Date.now() - stats.mtime.valueOf()
        if (crtDelta < (deltaSeconds * 1000)) {
          log.trace('update timeout did not expire ' +
            `${Math.floor(crtDelta / 1000)} < ${deltaSeconds}`)
          return false
        }
      }
    } catch (err: any) {
      log.trace('no previous update timestamp')
    }
    return true
  }

  async getLatestVersion (): Promise<boolean> {
    const context = this.context
    const config = context.config
    const log = context.log

    if (context.checkUpdatesIntervalSeconds === 0 ||
      (isCi) ||
      (config.isVersionRequest !== undefined && config.isVersionRequest) ||
      (!process.stdout.isTTY) ||
      ('NO_UPDATE_NOTIFIER' in process.env) ||
      (config.noUpdateNotifier !== undefined && config.noUpdateNotifier)) {
      log.trace('do not fetch latest version number.')
      return false
    }

    if (await this.didIntervalExpire(
      context.checkUpdatesIntervalSeconds)) {
      log.trace('fetching latest version number...')
      return true
    }

    return false
  }

  async checkUpdate (latestVersionPromise: Promise<string>): Promise<void> {
    const context = this.context
    const log = context.log

    if (latestVersionPromise === undefined) {
      // If the promise was not created, no action.
      return
    }

    let ver: string
    try {
      ver = await latestVersionPromise
      log.trace(`${context.packageJson.version} → ${ver}`)

      // The difference type between two semver versions, or undefined if
      // they are identical or the second one is lower than the first.
      if (semverDiff(context.packageJson.version, ver) !== undefined) {
        // If versions differ, notify user.
        const globalOption: string =
          (isInstalledGlobally || (os.platform() === 'win32'))
            ? ' --global'
            : ''

        let buffer = '\n'
        buffer += `>>> New version ${context.packageJson.version} -> `
        buffer += `${ver} available. <<<\n`
        buffer += ">>> Run '"
        if (os.platform() !== 'win32') {
          if (isInstalledGlobally && isPathInside(
            path.dirname(fileURLToPath(import.meta.url)), '/usr/local')) {
            // May not be very reliable if installed in another system location.
            buffer += 'sudo '
          }
        }
        buffer +=
          `npm install${globalOption} ${context.packageJson.name}@${ver}`
        buffer += "' to update. <<<"
        log.info(buffer)
      }

      if ((process.geteuid !== undefined) &&
        process.geteuid() !== process.getuid()) {
        // If running as root, skip writing the timestamp to avoid
        // later EACCES or EPERM.
        log.trace(`geteuid() ${process.geteuid()} != ${process.getuid()}`)
        return
      }
    } catch (err: any) {
      if (log.isDebug) {
        log.debug((err as Error).toString())
      } else {
        log.warn((err as Error).message)
      }
    }

    await makeDir(timestampsPath)

    const fpath = path.join(timestampsPath, context.packageJson.name +
      timestampSuffix)
    await deleteAsync(fpath, { force: true })

    // Create an empty file, only the modified date is checked.
    const fd = await fsPromises.open(fpath, 'w')
    await fd.close()

    log.debug('timestamp created')
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
    context.startTime = Date.now()

    const log = context.log
    log.trace(`${this.constructor.name}.main()`)

    const config = context.config

    argv.forEach((arg, index) => {
      log.trace(`main arg${index}: '${arg}'`)
    })

    const remainingArgs = CliOptions.parseOptions(argv, context)

    // After parsing the options, the debug level is finally known.
    log.level = config.logLevel

    log.trace(util.inspect(context.config))

    // Done again here, for REPL invocations.
    if (config.isVersionRequest !== undefined && config.isVersionRequest) {
      log.always(context.packageJson.version)
      return CliExitCodes.SUCCESS
    }

    // Copy relevant args to local array.
    // Start with 0, possibly end with `--`.
    const mainArgs = CliOptions.filterOwnArguments(argv)

    // Isolate commands as words with letters and inner dashes.
    // First non word (probably option) ends the list.
    const commands: string[] = []
    if (CliOptions.hasCommands()) {
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
      return CliExitCodes.SUCCESS // Help explicitly called.
    }

    await makeDir(config.cwd)
    // This global setting makes running multiple applications
    // in a server impossible.
    process.chdir(config.cwd)
    log.debug(`cwd()='${process.cwd()}'`)

    let exitCode: number = CliExitCodes.SUCCESS
    try {
      // The complex application, with multiple commands.
      if (CliOptions.hasCommands()) {
        if (commands.length === 0) {
          log.error('Missing mandatory command.')
          this.outputHelp()
          return CliExitCodes.ERROR.SYNTAX // No commands.
        }

        // Throws not supported or not unique.
        const found: CliOptionFoundModule = CliOptions.findCommandModule(
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

        const commandInstance = new CommandClass(context)
        context.commandInstance = commandInstance

        if (config.isHelpRequest !== undefined && config.isHelpRequest) {
          assert(context.CommandClass)
          // Show the command specific help.
          commandInstance.outputHelp()
          return CliExitCodes.SUCCESS // Help explicitly called.
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
          return CliExitCodes.SUCCESS // Help explicitly called.
        }

        log.debug(`'${context.programName}' started`)

        exitCode = await this.run(remainingArgs)
        log.debug(`'${context.programName}' - returned ${exitCode}`)
      }
    } catch (err) {
      exitCode = CliExitCodes.ERROR.APPLICATION
      if (err instanceof CliErrorSyntax) {
        // CLI triggered error. Treat it gently and try to be helpful.
        log.error(err.message)
        this.outputHelp()
        exitCode = err.exitCode
      } else if (err instanceof CliError) {
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

  // Search for classes derived from CliCommand.
  async findCommandClass (
    rootPath: string,
    moduleRelativePath: string
  ): Promise<any> {
    const parentClass = CliCommand

    const modulePath = path.join(rootPath, moduleRelativePath)

    // On Windows, absolute paths start with a drive letter, and the
    // explicit `file://` is mandatory.
    const moduleExports = await import(`file://${modulePath.toString()}`)

    // Return the first exported class derived from parent class (`CliCommand`).
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
      'define a run() method in the CliApplication derived class')
  }
}

// ----------------------------------------------------------------------------
