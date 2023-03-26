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

import { strict as assert } from 'node:assert'
import { spawn, SpawnOptionsWithoutStdio } from 'node:child_process'
import { Console } from 'node:console'
import path from 'node:path'
import { Writable } from 'node:stream'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/make-dir
import makeDir from 'make-dir'

// https://www.npmjs.com/package/tar
import tar from 'tar'

// ----------------------------------------------------------------------------

import { Xtest } from './xtest/src/main.js'
import { Logger } from '../../esm/index.js'
import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

/**
 * Support code for tests.
 */

// ----------------------------------------------------------------------------

export const nodeBin: string = process?.env['npm_node_execpath'] ??
  process?.env['NODE'] ??
  process?.execPath

export const appAbsolutePath =
  (programName: string, mockPath: string = programName): string => {
    return path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      mockPath, 'bin', programName + '.js')
  }

export const mockPath = (name: string): string => {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)), name)
}

// ============================================================================

interface cliResult {
  code: number
  stdout: string
  stderr: string
}

/**
 * @summary Run program in a separate process.
 *
 * @async
 * @param appAbsolutePath Program name.
 * @param argv Command line arguments.
 * @param spawnOpts Optional spawn options.
 * @returns Exit
 *  code and captured output/error streams.
 *
 * @description
 * Spawn a separate process to run node with the given arguments and
 * return the exit code and the stdio streams captured in strings.
 */
export async function runCli (
  appAbsolutePath: string,
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await new Promise((resolve, reject) => {
    spawnOpts.env = spawnOpts?.env ?? process.env
    spawnOpts.cwd = spawnOpts.cwd ??
      path.dirname(path.dirname(appAbsolutePath))

    // console.log(spawnOpts.cwd)

    // Runs in project root.
    // console.log(`Current directory: ${process.cwd()}`)
    let stdout: string = ''
    let stderr: string = ''

    const cmd = [appAbsolutePath, ...argv]

    // console.log(`${nodeBin} ${cmd.join(' ')}`)
    const child = spawn(nodeBin, cmd, spawnOpts)

    assert(child.stderr)
    child.stderr.on('data', (chunk) => {
      // console.log(chunk.toString())
      stderr += (chunk.toString() as string)
    })

    assert(child.stdout)
    child.stdout.on('data', (chunk) => {
      // console.log(chunk.toString())
      stdout += (chunk.toString() as string)
    })

    child.on('error', (err) => {
      reject(err)
    })

    child.on('close', (code: number) => {
      resolve({ code, stdout, stderr })
    })
  })
}

export async function runCliXtest (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli(appAbsolutePath('xtest'), argv, spawnOpts)
}

export async function runCliA1test (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli(appAbsolutePath('a1test'), argv, spawnOpts)
}

export async function runCliA2test (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli(appAbsolutePath('a2test'), argv, spawnOpts)
}

export async function runCliA3test (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli(appAbsolutePath('a3test'), argv, spawnOpts)
}

export async function runCliWtest (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli(
    appAbsolutePath('wtest-long-name', 'wtest'), argv, spawnOpts)
}

/**
 * @summary Run xtest as a library call.
 *
 * @param argv Command line arguments
 * @returns Exit code and captured output/error streams.
 *
 * @description
 * Call the application directly, as a regular module, and return
 * the exit code and the stdio streams captured in strings.
 */
export async function runLibXtest (
  argv: string[]
): Promise<cliResult> {
  assert(Xtest !== null, 'No application class')
  // Create two streams to local strings.
  let stdout = ''
  const ostream = new Writable({
    write (chunk, _encoding, callback) {
      stdout += (chunk.toString() as string)
      callback()
    }
  })

  let stderr = ''
  const errstream = new Writable({
    write (chunk, _encoding, callback) {
      stderr += (chunk.toString() as string)
      callback()
    }
  })

  const mockConsole = new Console(ostream, errstream)
  const mockLog = new Logger({ console: mockConsole })
  const context = new cli.Context({
    log: mockLog
  })
  const app = new Xtest({ context })
  const code = await app.run(argv)
  return { code, stdout, stderr }
}

/**
 * @summary Extract files from a .tgz archive into a folder.
 *
 * @async
 * @param tgzPath Path to archive file.
 * @param destPath Path to destination folder.
 * @returns Nothing.
 */
export async function extractTgz (tgzPath: string, destPath: string):
Promise<void> {
  await makeDir(destPath)
  return await tar.extract({
    file: tgzPath,
    cwd: destPath
  })
}

// ----------------------------------------------------------------------------
