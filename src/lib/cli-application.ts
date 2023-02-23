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

/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * This file provides the CLI startup code. It prepares a context
 * and calls the module `main()` code.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as util from 'node:util'
import * as vm from 'node:vm'

// ----------------------------------------------------------------------------

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
import { CliContext, CliConfig } from './cli-context.js'
import { CliOptions, CliOptionFoundModule } from './cli-options.js'

import { CliHelp } from './cli-help.js'
import { CliLogger, CliLogLevel } from './cli-logger.js'
import { CliExitCodes, CliError, CliErrorSyntax } from './cli-error.js'

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

const defaultLogLevel = 'info'

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
 * @classdesc
 * Base class for a CLI application.
 */
export class CliApplication {
  // --------------------------------------------------------------------------

  static rootPath: string
  static log: CliLogger
  static programName: string
  static config: CliConfig
  static hasInteractiveMode?: boolean
  static isInitialised?: boolean
  static command: CliCommand // actually an instance derived from it
  static Command: typeof CliCommand // actually a class derived from it
  static checkUpdatesIntervalSeconds?: number

  // --------------------------------------------------------------------------

  public context: CliContext
  public latestVersionPromise: Promise<string> | undefined = undefined

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
   *
   * To pass the exit code back to the system, use something like:
   *
   * ```
   * Xpm.start().then((code) => { process.exitCode = code })
   * ```
   */
  static async start (): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    // TODO: use package.json engine field.
    if (semver.lt(process.version, '14.0.0')) {
      console.error('Please use a newer node (at least 14.x).\n')
      return CliExitCodes.ERROR.PREREQUISITES
    }

    let exitCode = CliExitCodes.SUCCESS
    try {
      // Extract the name from the last path element; ignore extensions, if any.
      // const programName = path.basename(process.argv[1]).split('.')[0]

      // Avoid running on WScript. The journey may abruptly end here.
      // WscriptAvoider.quitIfWscript(programName)

      staticThis.log = new CliLogger(console)

      // Redirect to implementation code. After some common inits,
      // if not interactive, it'll call main().
      exitCode = await staticThis.doStart()
      // Pass through. Do not exit, to allow REPL to run.
    } catch (ex: any) {
      // This should catch possible errors during inits, otherwise
      // in main(), another catch will apply.
      exitCode = CliExitCodes.ERROR.APPLICATION
      if (ex instanceof CliError) {
        // CLI triggered error. Treat it gently.
        staticThis.log.error(ex.message)
        exitCode = ex.exitCode
      } else if (ex.constructor === Error ||
        ex.constructor === SyntaxError ||
        ex.constructor === TypeError) {
        // Other error. Treat it gently too.
        console.error(ex.message)
      } else /* istanbul ignore next */ {
        // System error, probably due to a bug (AssertionError).
        // Show the full stack trace.
        console.error(ex.stack)
      }
      staticThis.log.verbose(`exitCode = ${exitCode}`)
    }
    // Pass through. Do not call exit(), to allow callbacks (or REPL) to run.

    return exitCode
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
  static async doStart (): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ClassThis = this // To make it look like a class.

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
      '')
    staticThis.programName = programName

    // Set the application name, to make `ps` output more readable.
    // https://nodejs.org/docs/latest-v14.x/api/process.html#process_process_title
    // TypeScript complains that it is not writable.
    // process.title = staticThis.programName

    // Initialise the application, including commands and options.
    const context = await staticThis.initialiseContext(
      staticThis.programName
    )

    const log = context.log
    staticThis.log.level = log.level

    // These are early messages, not shown immediately,
    // they are delayed until the log level is known.
    if (context.package.description !== undefined) {
      log.verbose(`${context.package.description}`)
    }
    log.debug(`argv0: ${process.argv[1]}`)

    const config = context.config
    staticThis.config = config

    // Parse the common options, for example the log level.
    CliOptions.parseOptions(process.argv, context)

    log.level = config.logLevel

    process.argv.forEach((arg, index) => {
      log.debug(`start arg${index}: '${arg}'`)
    })

    log.trace(util.inspect(config))

    // App instances exist only within a given context.
    const app = new ClassThis(context)

    const exitCode = await app.main(process.argv.slice(2))
    await app.checkUpdate()

    // Be sure no exit() is called here, since it'll close the
    // process and prevent interactive usage, which is inherently
    // asynchronous.
    log.verbose(`doStart() returns ${exitCode}`)

    return exitCode
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
  static initialise (): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

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
                context.config.logLevel = val as CliLogLevel
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

    staticThis.doInitialise()

    assert(staticThis.rootPath, 'mandatory rootPath not set')
  }

  /**
   * @summary Default implementation for the static class initialiser.
   *
   * @returns {undefined} Nothing.
   *
   * @description
   * Override it in the derived implementation.
   */
  static doInitialise (): void /* istanbul ignore next */ {
    assert(false, 'Must override in derived implementation!')
  }

  /**
   * @summary Default initialiser for the configuration options.
   *
   * @param {Object} context Reference to the context object.
   * @returns {undefined} Nothing
   *
   * @description
   * If further inits are needed, override `doInitialiseConfiguration()`
   * in the derived implementation.
   */
  static initialiseConfiguration (context: CliContext): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    const config = context.config
    assert(config, 'Configuration')

    config.logLevel = defaultLogLevel

    const optionGroups = CliOptions.getCommonOptionGroups()
    optionGroups.forEach((optionGroup) => {
      optionGroup.optionDefs.forEach((optionDef) => {
        optionDef.init(context)
      })
    })

    staticThis.doInitialiseConfiguration(context)
  }

  /**
   * @summary Custom initialiser for the configuration options.
   *
   * @param {Object} context Reference to the context object.
   * @returns {undefined} Nothing.
   *
   * @description
   * Override it in the derived implementation.
   */
  static doInitialiseConfiguration (context: CliContext): void {
    const config = context.config
    assert(config, 'Configuration')
  }

  /**
   * @summary Initialise a minimal context object.
   *
   * @param {string} programName The invocation name of the program.
   * @param {Object} _context Reference to a context, or null to create an
   *   empty context.
   * @param {Object} _console Reference to a node console.
   * @param {Object} log Reference to a npm log instance.
   * @param {Object} config Reference to a configuration.
   * @returns {Object} Reference to context.
   */
  static async initialiseContext (
    programName: string,
    _context?: CliContext, // Conflicting name
    _console?: Console, // Conflicting name
    log?: CliLogger,
    config?: CliConfig
  ): Promise<CliContext> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this

    // Call the application initialisation callback, to prepare
    // the structure needed to manage the commands and option.
    if (!(staticThis.isInitialised !== undefined && staticThis.isInitialised)) {
      staticThis.initialise()

      staticThis.isInitialised = true
    }

    // Use the given context, or create an empty one.
    const context = _context ?? (vm.createContext() as CliContext)

    // REPL should always set the console, be careful not to
    // overwrite it.
    if (context.console === undefined) {
      // Cannot use || because REPL context has only a getter.
      context.console = _console ?? console
    }

    assert(context.console)
    context.programName = programName

    const argv1 = process.argv[1]?.trim()
    assert(argv1 !== undefined, 'Mandatory argv[1]')

    context.cmdPath = argv1
    context.processCwd = process.cwd()
    context.processEnv = process.env
    context.processArgv = process.argv

    // For convenience, copy root path from class to instance.
    context.rootPath = staticThis.rootPath

    if (context.package === undefined) {
      context.package = await staticThis.readPackageJson()
    }

    // Initialise configuration.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    context.config = config ?? ({} as CliConfig)
    staticThis.initialiseConfiguration(context)
    if (context.config.cwd === undefined) /* istanbul ignore next */ {
      context.config.cwd = context.processCwd
    }

    context.log = log ?? new CliLogger(context.console,
      context.config.logLevel)

    assert(context.log)

    CliOptions.initialise(context)

    return context
  }

  /**
   * @summary Read package JSON file.
   *
   * @param {string} rootPath The absolute path of the package.
   * @returns {Object} The package definition, unmodified.
   * @throws Error from `fs.readFile()` or `JSON.parse()`.
   *
   * @description
   * By default, this function uses the package root path
   * stored in the class property during initialisation.
   * When called from tests, the path must be passed explicitly.
   */
  static async readPackageJson (rootPath = this.rootPath): Promise<any> {
    const filePath = path.join(rootPath, 'package.json')
    const fileContent = await fsPromises.readFile(filePath)
    assert(fileContent !== null)
    return JSON.parse(fileContent.toString())
  }

  // --------------------------------------------------------------------------

  /**
   * Constructor, to remember the context.
   *
   * @param {Object} context Reference to a context.
   */
  constructor (context: CliContext) {
    assert(context)
    assert(context.console)
    assert(context.log)
    assert(context.config)

    this.context = context
    const log = this.context.log

    log.trace(`${this.constructor.name}.constructor()`)
  }

  /**
   * @summary Display the main help page.
   *
   * @returns {undefined}
   *
   * @description
   * Override it in the application if custom content is desired.
   */
  help (): void {
    const staticThis = this.constructor as typeof CliApplication

    const log = this.context.log
    log.trace(`${this.constructor.name}.help()`)

    const help = new CliHelp(this.context)

    if (staticThis.command !== undefined) {
      const optionGroups = staticThis.command.optionGroups
        .concat(CliOptions.getCommonOptionGroups())

      help.outputMainHelp(undefined, optionGroups, staticThis.command.title)
    } else {
      help.outputMainHelp(CliOptions.getUnaliasedCommands(),
        CliOptions.getCommonOptionGroups())
    }
  }

  async didIntervalExpire (deltaSeconds: number): Promise<boolean> {
    const context = this.context
    const log = context.log

    const fpath = path.join(timestampsPath, context.package.name +
      timestampSuffix)
    try {
      const stats = await fsPromises.stat(fpath)
      if (stats.mtime !== undefined) {
        const crtDelta = Date.now() - stats.mtime.getTime()
        if (crtDelta < (deltaSeconds * 1000)) {
          log.trace('update timeout did not expire ' +
            `${Math.floor(crtDelta / 1000)} < ${deltaSeconds}`)
          return false
        }
      }
    } catch (err) {
      log.trace('no previous update timestamp')
    }
    return true
  }

  async getLatestVersion (): Promise<void> {
    const staticThis = this.constructor as typeof CliApplication

    const context = this.context
    const config = context.config
    const log = context.log

    if (staticThis.checkUpdatesIntervalSeconds === undefined ||
      staticThis.checkUpdatesIntervalSeconds === 0 ||
      (isCi) ||
      (config.isVersionRequest !== undefined && config.isVersionRequest) ||
      (!process.stdout.isTTY) ||
      ('NO_UPDATE_NOTIFIER' in process.env) ||
      (config.noUpdateNotifier !== undefined && config.noUpdateNotifier)) {
      log.trace('do not fetch latest version number.')
      return
    }

    if (await this.didIntervalExpire(
      staticThis.checkUpdatesIntervalSeconds)) {
      log.trace('fetching latest version number...')
      // At this step only create the promise,
      // its result is checked before exit.
      this.latestVersionPromise = latestVersion(context.package.name)
    }
  }

  async checkUpdate (): Promise<void> {
    const context = this.context
    const log = context.log

    if (this.latestVersionPromise === undefined) {
      // If the promise was not created, no action.
      return
    }

    let ver: string
    try {
      ver = await this.latestVersionPromise
      log.trace(`${context.package.version} → ${ver}`)

      // The difference type between two semver versions, or undefined if
      // they are identical or the second one is lower than the first.
      if (semverDiff(context.package.version, ver) !== undefined) {
        // If versions differ, notify user.
        const globalOption: string =
          (isInstalledGlobally || (os.platform() === 'win32'))
            ? ' --global'
            : ''

        let buffer = '\n'
        buffer += `>>> New version ${context.package.version} -> `
        buffer += `${ver} available. <<<\n`
        buffer += ">>> Run '"
        if (os.platform() !== 'win32') {
          if (isInstalledGlobally && isPathInside(
            path.dirname(fileURLToPath(import.meta.url)), '/usr/local')) {
            // May not be very reliable if installed in another system location.
            buffer += 'sudo '
          }
        }
        buffer += `npm install${globalOption} ${context.package.name}@${ver}`
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
    } catch (err) {
      if (log.isDebug()) {
        log.debug((err as Error).toString())
      } else {
        log.warn((err as Error).message)
      }
    }

    await makeDir(timestampsPath)

    const fpath = path.join(timestampsPath, context.package.name +
      timestampSuffix)
    await deleteAsync(fpath, { force: true })

    // Create an empty file, only the modified date is checked.
    const fd = await fsPromises.open(fpath, 'w')
    await fd.close()

    log.debug('timestamp created')
  }

  /**
   * @summary The main entry point for the `xyz` command.
   *
   * @param {string[]} argv Arguments array.
   * @returns {number} The exit code.
   *
   * @description
   * Override it in the application if custom behaviour is desired.
   */
  async main (argv: string[]): Promise<number> {
    const staticThis = this.constructor as typeof CliApplication

    const context = this.context
    context.startTime = Date.now()

    const log = context.log
    log.trace(`${this.constructor.name}.main()`)

    const config = context.config

    argv.forEach((arg, index) => {
      log.trace(`main arg${index}: '${arg}'`)
    })

    staticThis.doInitialiseConfiguration(context)
    const remainingArgs = CliOptions.parseOptions(argv, context)

    log.trace(util.inspect(context.config))

    await this.getLatestVersion()

    // Early detection of `--version`, since it makes
    // all other irrelevant.
    if (config.isVersionRequest !== undefined && config.isVersionRequest) {
      log.always(context.package.version)
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

    // Must be executed before help().
    if (staticThis.Command !== undefined) {
      staticThis.command = new staticThis.Command(context)
    }

    // If no commands and -h, output help message.
    if ((commands.length === 0) &&
      (config.isHelpRequest !== undefined && config.isHelpRequest)) {
      this.help()
      return CliExitCodes.SUCCESS // Help explicitly called.
    }

    if (CliOptions.hasCommands()) {
      // If no commands, output help message and return error.
      if (commands.length === 0) {
        log.error('Missing mandatory command.')
        this.help()
        return CliExitCodes.ERROR.SYNTAX // No commands.
      }
    }

    await makeDir(config.cwd)
    process.chdir(config.cwd)
    log.debug(`cwd()='${process.cwd()}'`)

    let exitCode: number = CliExitCodes.SUCCESS
    try {
      if (staticThis.command !== undefined) {
        log.debug(`'${context.programName}' started`)

        exitCode = await staticThis.command.run(remainingArgs)
        log.debug(`'${context.programName}' - returned ${exitCode}`)
      } else {
        const found: CliOptionFoundModule = CliOptions.findCommandModule(
          commands)

        const CmdDerivedClass = await this.findCommandClass(
          context.rootPath,
          found.moduleRelativePath
        )

        // Full name commands, not the actual encountered shortcuts.
        context.fullCommands = found.matchedCommands

        log.debug(`Command(s): '${context.fullCommands.join(' ')}'`)

        // Use the original array, since we might have `--` options,
        // and skip already processed commands.
        const cmdArgs = remainingArgs.slice(commands.length -
          found.unusedCommands.length)
        cmdArgs.forEach((arg, index) => {
          log.trace(`cmd arg${index}: '${arg}'`)
        })

        staticThis.doInitialiseConfiguration(context)
        const cmdImpl = new CmdDerivedClass(context)

        log.debug(`'${context.programName} ` +
          `${context.fullCommands.join(' ')}' started`)

        exitCode = await cmdImpl.run(cmdArgs)
        log.debug(`'${context.programName} ` +
          `${context.fullCommands.join(' ')}' - returned ${exitCode}`)
      }
    } catch (err) {
      exitCode = CliExitCodes.ERROR.APPLICATION
      if (err instanceof CliErrorSyntax) {
        // CLI triggered error. Treat it gently and try to be helpful.
        log.error(err.message)
        this.help()
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
}

// ----------------------------------------------------------------------------
