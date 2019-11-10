/*
 * This file is part of the xPack distribution
 *   (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom
 * the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict'
/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const tar = require('tar')
const util = require('util')
const spawn = require('child_process').spawn
const Console = require('console').Console
const Writable = require('stream').Writable

const Xtest = require('./mock/xtest/main.js').Xtest
const Ytest = require('./mock/ytest/main.js').Ytest
const Ztest = require('./mock/ztest/main.js').Ztest
const Wtest = require('./mock/wtest/main.js').Wtest

const Promisifier = require('@xpack/es6-promisifier').Promisifier

// ----------------------------------------------------------------------------

const mkdirpPromise = Promisifier.promisify(require('mkdirp'))

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
xtest.executableName = path.join('.', 'test', xtest.mockPath, 'bin',
  xtest.programName + '.js')

const ytest = {}
ytest.programName = 'ytest'
ytest.mockPath = path.join('mock', 'ytest')
ytest.executableName = path.join('.', 'test', ytest.mockPath, 'bin',
  ytest.programName + '.js')

const ztest = {}
ztest.programName = 'ztest'
ztest.mockPath = path.join('mock', 'ztest')
ztest.executableName = path.join('.', 'test', ztest.mockPath, 'bin',
  ztest.programName + '.js')

const wtest = {}
wtest.programName = 'wtest-long-name'
wtest.mockPath = path.join('mock', 'wtest')
wtest.executableName = path.join('.', 'test', wtest.mockPath, 'bin',
  wtest.programName + '.js')

// ============================================================================

/**
 * @class Main
 */
// export
class Common {
  /**
   * @summary Run program in a separate process.
   *
   * @async
   * @param {string} name Program name.
   * @param {string[]} argv Command line arguments.
   * @param {Object} spawnOpts Optional spawn options.
   * @returns {{code: number, stdout: string, stderr: string}} Exit
   *  code and captured output/error streams.
   *
   * @description
   * Spawn a separate process to run node with the given arguments and
   * return the exit code and the stdio streams captured in strings.
   */
  static async cliRun (name, argv, spawnOpts = {}) {
    return new Promise((resolve, reject) => {
      spawnOpts.env = spawnOpts.env || process.env

      // Runs in project root.
      // console.log(`Current directory: ${process.cwd()}`)
      const cmd = [name]
      const child = spawn(nodeBin, cmd.concat(argv), spawnOpts)

      const stdout = []
      let stdoutBuf = ''
      assert(child.stdout)
      child.stdout.on('data', (chunk) => {
        // console.log(chunk.toString())
        stdoutBuf += chunk
        while (true) {
          const ix = stdoutBuf.indexOf('\n')
          if (ix === -1) {
            break
          }
          stdout.push(stdoutBuf.substring(0, ix))
          stdoutBuf = stdoutBuf.substring(ix + 1)
        }
      })

      const stderr = []
      let stderrBuf = ''
      assert(child.stderr)
      child.stderr.on('data', (chunk) => {
        // console.log(chunk.toString())
        stderrBuf += chunk
        while (true) {
          const ix = stderrBuf.indexOf('\n')
          if (ix === -1) {
            break
          }
          stderr.push(stderrBuf.substring(0, ix))
          stderrBuf = stderrBuf.substring(ix + 1)
        }
      })

      child.on('error', (err) => {
        reject(err)
      })

      child.on('close', (code) => {
        if (stdoutBuf.length > 0) {
          stdout.push(stdoutBuf)
        }
        if (stderrBuf.length > 0) {
          stderr.push(stderrBuf)
        }
        resolve({ code, stdout, stderr })
      })
    })
  }

  static async cliRunXtest (argv, spawnOpts = {}) {
    const Self = this
    return Self.cliRun(xtest.executableName, argv, spawnOpts)
  }

  // --------------------------------------------------------------------------

  /**
   * @summary Run xtest as a library call.
   *
   * @async
   * @param {string} programName Program name.
   * @param {string} ClassObject Class object.
   * @param {string[]} argv Command line arguments
   * @returns {{code: number, stdout: string, stderr: string}} Exit
   *  code and captured output/error streams.
   *
   * @description
   * Call the application directly, as a regular module, and return
   * the exit code and the stdio streams captured in strings.
   */
  static async libRun (programName, ClassObject, argv) {
    assert(ClassObject, 'No application class')

    // Create two streams to local strings.
    const stdout = []
    let stdoutBuf = ''
    const ostream = new Writable({
      write (chunk, encoding, callback) {
        stdoutBuf += chunk
        while (true) {
          const ix = stdoutBuf.indexOf('\n')
          if (ix === -1) {
            break
          }
          stdout.push(stdoutBuf.substring(0, ix))
          stdoutBuf = stdoutBuf.substring(ix + 1)
        }
        callback()
      }
    })

    const stderr = []
    let stderrBuf = ''
    const errstream = new Writable({
      write (chunk, encoding, callback) {
        stderrBuf += chunk
        while (true) {
          const ix = stderrBuf.indexOf('\n')
          if (ix === -1) {
            break
          }
          stderr.push(stderrBuf.substring(0, ix))
          stderrBuf = stderrBuf.substring(ix + 1)
        }
        callback()
      }
    })

    const mockConsole = new Console(ostream, errstream)

    const app = new ClassObject({
      programName: programName,
      argv: ['', programName, ...argv],
      env: [],
      console: mockConsole,
      cwd: process.cwd(),
      enableInteractiveMode: true
    })
    const code = await app.main(argv)
    return { code, stdout, stderr }
  }

  static async libRunXtest (argv) {
    const Self = this
    return Self.libRun('xtest', Xtest, argv)
  }

  static async libRunYtest (argv) {
    const Self = this
    return Self.libRun('ytest', Ytest, argv)
  }

  static async libRunZtest (argv) {
    const Self = this
    return Self.libRun('ztest', Ztest, argv)
  }

  static async libRunWtest (argv) {
    const Self = this
    return Self.libRun('wtest-long-name', Wtest, argv)
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
    await mkdirpPromise(destPath)
    return new Promise((resolve, reject) => {
      fs.createReadStream(tgzPath)
        .on('error', (er) => { reject(er) })
        .pipe(zlib.createGunzip())
        .on('error', (er) => { reject(er) })
        .pipe(tar.extract({ cwd: destPath }))
        .on('error', (er) => { reject(er) })
        .on('end', () => { resolve() })
    })
  }
}

Common.xtest = xtest
Common.ytest = ytest
Common.ztest = ztest
Common.wtest = wtest

// ----------------------------------------------------------------------------

class MockLog {
  constructor () {
    this.lines = []
  }

  info (msg = '', ...args) {
    const str = util.format(msg, ...args)
    this.lines.push(str)
  }

  debug (msg = '', ...args) {
    const str = util.format(msg, ...args)
    this.lines.push(str)
  }

  trace (msg = '', ...args) {
    const str = util.format(msg, ...args)
    this.lines.push(str)
  }

  clear () {
    this.lines = []
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The Main class is added as a property to this object.

module.exports.Common = Common
module.exports.MockLog = MockLog

// In ES6, it would be:
// export class Common { ... }
// ...
// import { Common } from 'common.js'

// ----------------------------------------------------------------------------
