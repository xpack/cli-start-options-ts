/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2023 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * Test the context class.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.Context)

// ----------------------------------------------------------------------------

await test('cli.Context constructor(log)', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })

  t.equal(context.log, log, 'log')
  t.equal(context.console, log.console, 'console')
  t.equal(context.programName, cli.getProgramName(), 'programName process')
  t.equal(context.cmdPath, process.argv[1], 'cmdPath process')
  t.equal(context.processCwd, process.cwd(), 'processCwd process')
  t.equal(context.processEnv, process.env, 'processEnv process')
  t.equal(context.processArgv, process.argv, 'processArgv process')

  t.ok(Date.now() - context.startTimestampMilliseconds < 100,
    'startTimeMilliseconds')

  t.ok(context.config instanceof cli.Configuration, 'config')
  t.ok(context.options instanceof cli.Options, 'options')

  t.equal(typeof context.packageJson, 'object', 'packageJson')

  t.ok(Array.isArray(context.matchedCommands), 'matchedCommands array')
  t.equal(context.matchedCommands.length, 0, 'matchedCommands empty')

  t.ok(Array.isArray(context.unparsedArgv), 'unparsedArgv array')
  t.equal(context.unparsedArgv.length, 0, 'unparsedArgv empty')

  t.ok(Array.isArray(context.ownArgv), 'ownArgv array')
  t.equal(context.ownArgv.length, 0, 'ownArgv empty')

  t.ok(Array.isArray(context.forwardableArgv), 'forwardableArgv array')
  t.equal(context.forwardableArgv.length, 0, 'forwardableArgv empty')

  t.equal(context.commandNode, undefined, 'commandNode')
  t.equal(context.rootPath, undefined, 'rootPath')

  t.end()
})

await test('cli.Context constructor(programName)', async (t) => {
  const log = new cli.Logger()
  const name = 'my-name'
  const context = new cli.Context({ log, programName: name })

  t.equal(context.programName, name, `programName ${name}`)

  t.end()
})

await test('cli.Context constructor(processCwd)', async (t) => {
  const log = new cli.Logger()
  const cwd = 'my-cwd'
  const context = new cli.Context({ log, processCwd: cwd })

  t.equal(context.processCwd, cwd, `processCwd ${cwd}`)

  t.end()
})

await test('cli.Context constructor(processEnv)', async (t) => {
  const log = new cli.Logger()
  const env: NodeJS.ProcessEnv = {
    ONE: 'one',
    TWO: 'two'
  }
  const context = new cli.Context({ log, processEnv: env })

  t.equal(context.processEnv, env, 'processEnv')

  t.end()
})

await test('cli.Context constructor(processArgv)', async (t) => {
  const log = new cli.Logger()
  const cmdPath = 'a/b.c'
  const argv = ['node', cmdPath]
  const context = new cli.Context({ log, processArgv: argv })

  t.equal(context.processArgv, argv, 'processArgv')
  t.equal(context.cmdPath, cmdPath, `cmdPath ${cmdPath}`)
  t.equal(context.programName, 'b', 'programName b')

  t.end()
})

await test('cli.Context constructor(context)', async (t) => {
  const log = new cli.Logger()
  const name = 'my-name'
  const cwd = 'my-cwd'
  const env: NodeJS.ProcessEnv = {
    ONE: 'one',
    TWO: 'two'
  }
  const cmdPath = 'a/b.c'
  const argv = ['node', cmdPath]

  // const argv = [ 'one', 'two' ]
  const contextTemplate = new cli.Context({
    log,
    programName: name,
    processCwd: cwd,
    processEnv: env,
    processArgv: argv
  })

  const rootPath = 'a/b'
  contextTemplate.rootPath = rootPath

  const packageJson = { name: 'package', version: '1.2.3' }
  contextTemplate.packageJson = packageJson

  const matchedCommands = ['one', 'two']
  contextTemplate.matchedCommands = matchedCommands

  const groups: cli.OptionsGroup[] = [
    {
      title: 'one',
      optionsDefinitions: [],
      isCommon: true
    },
    {
      title: 'two',
      optionsDefinitions: []
    }
  ]
  contextTemplate.options.addGroups(groups)

  // --------------------------------------------------------------------------

  const context = new cli.Context({ log, context: contextTemplate })

  t.equal(context.processCwd, cwd, `processCwd ${cwd}`)
  t.equal(context.processEnv, env, 'processEnv')
  t.equal(context.processArgv, argv, 'processArgv')
  t.equal(context.cmdPath, cmdPath, `cmdPath ${cmdPath}`)

  t.equal(context.programName, name, `programName ${name}`)

  t.equal(context.options.commonGroups.length, 1, 'has commonGroups')
  t.equal(context.options.commonGroups[0]?.title, 'one', 'commonGroup one')

  t.equal(context.options.groups.length, 1, 'has groups')
  t.equal(context.options.groups[0]?.title, 'two', 'group one')

  t.equal(context.rootPath, rootPath, `rootPath ${rootPath}`)
  t.equal(context.packageJson, packageJson, 'packageJson')
  t.equal(context.matchedCommands, matchedCommands, 'matchedCommands')

  t.end()
})

// ----------------------------------------------------------------------------
