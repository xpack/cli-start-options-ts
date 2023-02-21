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

import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { Console } from 'node:console'
import path from 'node:path'
import { Writable } from 'node:stream'

// ----------------------------------------------------------------------------

import tar from 'tar'

// ----------------------------------------------------------------------------

import { Xtest } from './mock/xtest/main.js'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/make-dir
import makeDir from 'make-dir'

// ----------------------------------------------------------------------------

/**
 * Test common options, like --version, --help, etc.
 */

// ----------------------------------------------------------------------------

const nodeBin = process.env.npm_node_execpath || process.env.NODE ||
  process.execPath
const xtest = {}
xtest.programName = 'xtest'
xtest.mockPath = path.join('mock', 'xtest')
xtest.executableName = path.join('.', 'tests', xtest.mockPath, 'bin',
  xtest.programName + '.js')

const a1test = {}
a1test.programName = 'a1test'
a1test.mockPath = path.join('mock', 'a1test')
a1test.executableName = path.join('.', 'tests', a1test.mockPath, 'bin',
  a1test.programName + '.js')

const a2test = {}
a2test.programName = 'a2test'
a2test.mockPath = path.join('mock', 'a2test')
a2test.executableName = path.join('.', 'tests', a2test.mockPath, 'bin',
  a2test.programName + '.js')

const a3test = {}
a3test.programName = 'a3test'
a3test.mockPath = path.join('mock', 'a3test')
a3test.executableName = path.join('.', 'tests', a3test.mockPath, 'bin',
  a3test.programName + '.js')

const wtest = {}
wtest.programName = 'wtest-long-name'
wtest.mockPath = path.join('mock', 'wtest')
wtest.executableName = path.join('.', 'tests', wtest.mockPath, 'bin',
  wtest.programName + '.js')

// ============================================================================

/**
 * @class Main
 */
export class Common {
  /**
   * @summary Run program in a separate process.
   *
   * @async
   * @param {string} name Program name.
   * @param {string[]} args Command line arguments.
   * @param {Object} spawnOpts Optional spawn options.
   * @returns {{code: number, stdout: string, stderr: string}} Exit
   *  code and captured output/error streams.
   *
   * @description
   * Spawn a separate process to run node with the given arguments and
   * return the exit code and the stdio streams captured in strings.
   */
  static async cli (name, args, spawnOpts = {}) {
    return new Promise((resolve, reject) => {
      spawnOpts.env = spawnOpts.env || process.env

      // Runs in project root.
      // console.log(`Current directory: ${process.cwd()}`)
      let stdout = ''
      let stderr = ''
      const cmd = [name]
      const child = spawn(nodeBin, cmd.concat(args), spawnOpts)

      assert(child.stderr)
      child.stderr.on('data', (chunk) => {
        // console.log(chunk.toString())
        stderr += chunk
      })

      assert(child.stdout)
      child.stdout.on('data', (chunk) => {
        // console.log(chunk.toString())
        stdout += chunk
      })

      child.on('error', (err) => {
        reject(err)
      })

      child.on('close', (code) => {
        resolve({ code, stdout, stderr })
      })
    })
  }

  static xtest = xtest

  static async xtestCli (args, spawnOpts = {}) {
    const Self = this
    return Self.cli(xtest.executableName, args, spawnOpts)
  }

  static async a1testCli (args, spawnOpts = {}) {
    const Self = this
    return Self.cli(a1test.executableName, args, spawnOpts)
  }

  static async a2testCli (args, spawnOpts = {}) {
    const Self = this
    return Self.cli(a2test.executableName, args, spawnOpts)
  }

  static async a3testCli (args, spawnOpts = {}) {
    const Self = this
    return Self.cli(a3test.executableName, args, spawnOpts)
  }

  static async wtestCli (args, spawnOpts = {}) {
    const Self = this
    return Self.cli(wtest.executableName, args, spawnOpts)
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
  static async xtestLib (args, ctx = null) {
    assert(Xtest !== null, 'No application class')
    // Create two streams to local strings.
    let stdout = ''
    const ostream = new Writable({
      write (chunk, encoding, callback) {
        stdout += chunk.toString()
        callback()
      }
    })

    let stderr = ''
    const errstream = new Writable({
      write (chunk, encoding, callback) {
        stderr += chunk.toString()
        callback()
      }
    })

    const _console = new Console(ostream, errstream)
    const context =
      await Xtest.initialiseContext(xtest.programName, ctx, _console)
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
  static async extractTgz (tgzPath, destPath) {
    await makeDir(destPath)
    return tar.extract({
      file: tgzPath,
      cwd: destPath
    })
  }
}

// ----------------------------------------------------------------------------
