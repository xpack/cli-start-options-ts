/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/**
 * Test REPL use.
 * SKIPPED, NOT YET FUNCTIONAL!
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import {
  spawn,
  ChildProcessWithoutNullStreams,
  SpawnOptionsWithoutStdio
} from 'node:child_process'

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

// ----------------------------------------------------------------------------

import { nodeBin, appAbsolutePath, mockPath } from '../mock/common.js'
import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.Application)
assert(cli.ExitCodes)

// ----------------------------------------------------------------------------

const debug = true

// ----------------------------------------------------------------------------

let pack: cli.NpmPackageJson

// ----------------------------------------------------------------------------

await test('setup', async (t) => {
  // Read in the package.json, to later compare version.
  const rootPath: string = mockPath('xtest')
  pack = await cli.readPackageJson(rootPath)
  t.ok(pack, 'package was parsed')
  t.ok(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

await test('xtest -i (spawn)', async (t) => {
  const executableName: string = appAbsolutePath('xtest')
  const cmd: string[] = [executableName, '-i']
  const opts: SpawnOptionsWithoutStdio = {
    env: process.env
  }

  const child: ChildProcessWithoutNullStreams = spawn(nodeBin, cmd, opts)

  child.on('error', (err) => {
    if (debug) {
      console.log('error')
    }
    t.fail(err.message)
    t.end()
  })

  child.on('close', (code) => {
    // Check exit code.
    if (debug) {
      console.log('close')
    }
    t.equal(code, cli.ExitCodes.SUCCESS, 'exit code success')
    t.end()
  })

  // For unknown reasons, REPL stderr is not forwarded here,
  // but to stdout.
  let stderr: string = ''
  if (child.stderr !== undefined) {
    child.stderr.on('data', (chunk) => {
      const s = chunk.toString() as string
      if (debug) {
        console.log(chunk, s)
      }
      if (!s.startsWith('Debugger attached')) {
        stderr += s
      }
    })
  }

  let stdout: string = ''
  let count: number = 2
  if (child.stdout !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    child.stdout.on('data', async (chunk) => {
      const s = chunk.toString() as string
      if (debug) {
        console.log(chunk, s)
      }
      stdout += s
      if (count === 0) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        t.test('title', (t) => {
          t.equal(stdout, '\nMock Test REPL\n')
          t.equal(stderr, '', 'stderr is empty')
          t.end()
        })
      } else if (count === 1) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        t.test('helper', (t) => {
          t.equal(stdout, '(use .exit to quit)\nxtest> ')
          t.equal(stderr, '', 'stderr is empty')
          t.end()
        })
        child.stdin.write('\n')
      } else {
        let outStr: string = ''
        if (stdout.endsWith('xtest> ')) {
          stdout = stdout.replace('xtest> ', '')
          if (debug) {
            console.log(stdout)
          }
          // A small state machine to check the conditions after each
          // new prompt identified.
          if (count === 2) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            t.test('first prompt', (t) => {
              t.ok(true, 'prompt ok')
              t.equal(stderr, '', 'stderr is empty')
              t.end()
            })

            outStr = '--version'
          } else if (count === 3) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            t.test('--version', (t) => {
              t.equal(stdout, pack.version + '\n', 'version value')
              t.end()
            })

            outStr = '-h'
          } else if (count === 4) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            await t.test('-h', (t) => {
              t.match(stdout, 'Usage: xtest <command> [<subcommand>...]',
                'has Usage')
              // t.equal(stderr, '', 'stderr empty')
              t.end()
            })

            outStr = '--version'
          } else if (count === 5) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            await t.test('--version again', (t) => {
              t.equal(stdout, pack.version + '\n', 'version value')
              t.end()
            })

            outStr = 'copy -h'
          } else if (count === 6) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            await t.test('copy -h', (t) => {
              // console.log(stdout)
              t.match(stdout, 'Usage: xtest copy [options...] --file <file> ' +
                '--output <file>', 'has code Usage')
              // t.equal(stderr, '', 'stderr empty')
              t.end()
            })

            outStr = 'copy'
          } else if (count === 7) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            await t.test('copy', (t) => {
              t.match(stdout, 'Usage: xtest copy [options...] --file <file> ' +
                '--output <file>', 'has code Usage')
              t.match(stdout, 'Mandatory \'--file\' not found',
                '--file not found')
              t.end()
            })

            outStr = 'xyz'
          } else if (count === 8) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            await t.test('xyz', (t) => {
              t.match(stdout, 'Command \'xyz\' not supported.',
                'xyz is not supported')
              t.match(stdout, 'Usage: xtest <command> [<subcommand>...]',
                'has Usage')
              // t.equal(stderr, '', 'stderr empty')
              t.end()
            })

            outStr = '.exit'
          }
          if (outStr.length > 0) {
            if (debug) {
              console.log(`sent ${outStr}`)
            }
            child.stdin.write(outStr + '\n')
          }
        }
      }
      count++
      if (debug) {
        console.log(count)
      }
      stdout = ''
      stderr = ''
    })
  }
})

// ----------------------------------------------------------------------------
