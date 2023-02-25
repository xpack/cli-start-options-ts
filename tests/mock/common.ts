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
import { CliContext } from '../../dist/index.js'

// ----------------------------------------------------------------------------

/**
 * Test common options, like --version, --help, etc.
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
 * @class Main
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Common {
  /**
   * @summary Run program in a separate process.
   *
   * @async
   * @param {string} appAbsolutePath Program name.
   * @param {string[]} args Command line arguments.
   * @param {Object} spawnOpts Optional spawn options.
   * @returns {{code: number, stdout: string, stderr: string}} Exit
   *  code and captured output/error streams.
   *
   * @description
   * Spawn a separate process to run node with the given arguments and
   * return the exit code and the stdio streams captured in strings.
   */
  static async cli (
    appAbsolutePath: string,
    args: string[],
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

      const cmd = [appAbsolutePath, ...args]

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

  static async xtestCli (
    args: string[],
    spawnOpts: SpawnOptionsWithoutStdio = {}
  ): Promise<cliResult> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this
    return await staticThis.cli(appAbsolutePath('xtest'), args, spawnOpts)
  }

  static async a1testCli (
    args: string[],
    spawnOpts: SpawnOptionsWithoutStdio = {}
  ): Promise<cliResult> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this
    return await staticThis.cli(appAbsolutePath('a1test'), args, spawnOpts)
  }

  static async a2testCli (
    args: string[],
    spawnOpts: SpawnOptionsWithoutStdio = {}
  ): Promise<cliResult> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this
    return await staticThis.cli(appAbsolutePath('a2test'), args, spawnOpts)
  }

  static async a3testCli (
    args: string[],
    spawnOpts: SpawnOptionsWithoutStdio = {}
  ): Promise<cliResult> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this
    return await staticThis.cli(appAbsolutePath('a3test'), args, spawnOpts)
  }

  static async wtestCli (
    args: string[],
    spawnOpts: SpawnOptionsWithoutStdio = {}
  ): Promise<cliResult> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const staticThis = this
    return await staticThis.cli(
      appAbsolutePath('wtest-long-name', 'wtest'), args, spawnOpts)
  }

  /**
   * @summary Run xtest as a library call.
   *
   * @async
   * @param {string[]} args Command line arguments
   * @param {Object} ctx Optional context.
   * @returns {{code: number, stdout: string, stderr: string}} Exit
   *  code and captured output/error streams.
   *
   * @description
   * Call the application directly, as a regular module, and return
   * the exit code and the stdio streams captured in strings.
   */
  static async xtestLib (
    args: string[],
    ctx: CliContext | undefined = undefined
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

    const _console = new Console(ostream, errstream)
    const context =
      await Xtest.initialiseContext('xtest', ctx, _console)
    const app = new Xtest(context)
    const code = await app.main(args)
    return { code, stdout, stderr }
  }

  /**
   * @summary Extract files from a .tgz archive into a folder.
   *
   * @async
   * @param {string} tgzPath Path to archive file.
   * @param {string} destPath Path to destination folder.
   * @returns {undefined} Nothing.
   */
  static async extractTgz (tgzPath: string, destPath: string): Promise<void> {
    await makeDir(destPath)
    return await tar.extract({
      file: tgzPath,
      cwd: destPath
    })
  }
}

// ----------------------------------------------------------------------------
