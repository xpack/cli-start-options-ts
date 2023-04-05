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
// import { Console } from 'node:console'
import path from 'node:path'
// import { Writable } from 'node:stream'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/make-dir
import makeDir from 'make-dir'

// https://www.npmjs.com/package/tar
import tar from 'tar'

import { MockConsole } from '@xpack/mock-console'

// ----------------------------------------------------------------------------

import { Xtest } from './xtest/src/main.js'
import { Logger, getProgramName } from '../../esm/index.js'
import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

/*
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
  exitCode: number
  outLines: string[]
  errLines: string[]
}

/**
 * @summary Run program in a separate process.
 *
 * @param appAbsolutePath Program name.
 * @param argv Command line arguments.
 * @param spawnOpts Optional spawn options.
 * @returns Exit code and captured output/error streams.
 *
 * @description
 * Spawn a separate process to run node with the given arguments and
 * return the exit code and the stdio streams captured in strings.
 */
export async function runCli (params: {
  appAbsolutePath: string
  argv: string[]
  spawnOpts?: SpawnOptionsWithoutStdio
}): Promise<cliResult> {
  return await new Promise((resolve, reject) => {
    const spawnOpts = params.spawnOpts ?? {}
    spawnOpts.env = params.spawnOpts?.env ?? process.env
    spawnOpts.cwd = params.spawnOpts?.cwd ??
      path.dirname(path.dirname(params.appAbsolutePath))

    params.spawnOpts = spawnOpts
    // console.log(spawnOpts.cwd)

    // Runs in project root.
    // console.log(`Current directory: ${process.cwd()}`)
    const outLines: string[] = []
    const errLines: string[] = []

    let outBuffer = ''
    let errBuffer = ''

    const cmd = [params.appAbsolutePath, ...params.argv]

    // console.log(`${nodeBin} ${cmd.join(' ')}`)
    const child = spawn(nodeBin, cmd, spawnOpts)

    assert(child.stdout)
    child.stdout.on('data', (chunk) => {
      // console.log(chunk.toString())
      // stdout += (chunk.toString() as string)
      outBuffer += chunk.toString('utf-8') as string
      while (true) {
        const ix = outBuffer.indexOf('\n')
        if (ix === -1) {
          break
        }
        outLines.push(outBuffer.substring(0, ix))
        outBuffer = outBuffer.substring(ix + 1)
      }
    })

    assert(child.stderr)
    child.stderr.on('data', (chunk) => {
      // console.log(chunk.toString())
      // stderr += (chunk.toString() as string)
      errBuffer += chunk.toString('utf-8') as string

      // Split lines that include the line terminator.
      while (true) {
        const ix = errBuffer.indexOf('\n')
        if (ix === -1) {
          break
        }
        errLines.push(errBuffer.substring(0, ix))
        errBuffer = errBuffer.substring(ix + 1)
      }
    })

    child.on('error', (err) => {
      reject(err)
    })

    child.on('close', (exitCode: number) => {
      resolve({
        exitCode,
        outLines,
        errLines
      })
    })
  })
}

export async function runCliXtest (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli({
    appAbsolutePath: appAbsolutePath('xtest'),
    argv,
    spawnOpts
  })
}

export async function runCliA1test (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli({
    appAbsolutePath: appAbsolutePath('a1test'),
    argv,
    spawnOpts
  })
}

export async function runCliA2test (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli({
    appAbsolutePath: appAbsolutePath('a2test'),
    argv,
    spawnOpts
  })
}

export async function runCliA3test (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli({
    appAbsolutePath: appAbsolutePath('a3test'),
    argv,
    spawnOpts
  })
}

export async function runCliWtest (
  argv: string[],
  spawnOpts: SpawnOptionsWithoutStdio = {}
): Promise<cliResult> {
  return await runCli({
    appAbsolutePath: appAbsolutePath('wtest-long-name', 'wtest'),
    argv,
    spawnOpts
  })
}

// ----------------------------------------------------------------------------

/**
 * @summary Run xtest as a library call.
 *
 * @param params.ClassObject The type of a Class object.
 * @param params.appAbsolutePath A string with the program path.
 * @param params.argv A string array with the command line arguments.
 * @returns Exit code and captured output/error streams.
 *
 * @description
 * Call the application directly, as a regular module, and return
 * the exit code and the stdio streams captured in strings.
 */
export async function libRun (params: {
  ClassObject: typeof cli.Application
  appAbsolutePath: string
  argv: string[]
}): Promise<cliResult> {
  assert(params.ClassObject, 'No application class')

  const mockConsole = new MockConsole()
  const mockLog = new Logger({ console: mockConsole })

  const programName: string = getProgramName(
    path.basename(params.appAbsolutePath))

  // process.argv[0] - the node full path
  // process.argv[1] - the full path of the invoking script
  const context = new cli.Context({
    log: mockLog,
    programName,
    processArgv: ['node', params.appAbsolutePath, ...params.argv]
  })

  const exitCode = await params.ClassObject.start({ context })
  return {
    exitCode,
    outLines: mockConsole.outLines,
    errLines: mockConsole.errLines
  }
}

/**
 * @summary Run xtest as a library call.
 *
 * @param argv A string array with the command line arguments.
 * @returns Exit code and captured output/error streams.
 *
 * @description
 * Call the application directly, as a regular module, and return
 * the exit code and the stdio streams captured in strings.
 */
export async function runLibXtest (
  argv: string[]
): Promise<cliResult> {
  return await libRun({
    ClassObject: Xtest,
    appAbsolutePath: appAbsolutePath('xtest'),
    argv
  })
}

export function splitLines (message: string): string[] {
  const lines = message.split(/\r?\n/)

  if (lines.length > 0 && lines[lines.length - 1]?.length === 0) {
    // If the last line is empty, strip it.
    return lines.slice(0, lines.length - 1)
  }
  return lines
}

// ----------------------------------------------------------------------------

/**
 * @summary Extract files from a .tgz archive into a folder.
 *
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
