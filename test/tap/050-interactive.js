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

/**
 * Test common options, like --version, --help, etc.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')
const spawn = require('child_process').spawn
const path = require('path')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const Common = require('../common.js').Common

const CliApplication = require('../../index.js').CliApplication
const CliExitCodes = require('../../index.js').CliExitCodes
const CliUtils = require('../../index.js').CliUtils

assert(CliApplication)
assert(CliExitCodes)
assert(CliUtils)

// ----------------------------------------------------------------------------

const debug = false

// ----------------------------------------------------------------------------

const nodeBin = process.env.npm_node_execpath || process.env.NODE ||
  process.execPath
const executableName = Common.xtest.executableName

let pack = null
const rootAbsolutePath = path.resolve(path.dirname(__dirname),
  Common.xtest.mockPath)

// ----------------------------------------------------------------------------

const sleep = async (millis) => {
  return new Promise((resolve) => {
    if (debug) {
      console.log(`sleep ${millis}`)
    }
    setTimeout(() => { resolve() }, millis)
  })
}

class XtestImmediate {
  constructor (cmd, opts) {
    if (debug) {
      console.log('constructor')
    }
    this.stdout = ''
    this.stderr = ''

    this.promise = new Promise((resolve, reject) => {
      if (debug) {
        console.log('new promise')
      }
      this.proc = spawn(nodeBin, cmd, opts)

      this.proc.on('error', (err) => {
        if (debug) {
          console.log('on.error')
        }
        reject(err)
      })

      this.proc.on('close', (code) => {
        if (debug) {
          console.log('on.close')
        }
        resolve(code)
      })

      if (this.proc.stdout) {
        this.proc.stdout.on('data', (chunk) => {
          if (debug) {
            console.log(chunk)
            console.log(`stdout '${chunk.toString()}'`)
          }
          this.stdout += chunk
        })
      }

      if (this.proc.stderr) {
        this.proc.stderr.on('data', (chunk) => {
          if (debug) {
            console.log(chunk)
            console.log(`stderr '${chunk.toString()}'`)
          }
          this.stderr += chunk
        })
      }
    })
  }

  writeToInput (str) {
    if (debug) {
      console.log(`stdin '${str}'`)
    }
    if (this.proc.stdin) {
      this.proc.stdin.write(`${str}\n`)
    }
  }

  readFromStderr () {
    const tmp = this.stderr
    this.stderr = ''
    if (debug) {
      console.log(`err '${tmp}'`)
    }
    return tmp
  }

  async readFromStdout () {
    let tmp
    while (true) {
      if (this.stdout.includes('xtest> ')) {
        tmp = this.stdout.replace('xtest> ', '')
        break
      }
      await sleep(10)
    }
    this.stdout = ''
    if (debug) {
      console.log(`out '${tmp}'`)
    }
    return tmp
  }
}

// ----------------------------------------------------------------------------

test('setup', async (t) => {
  // Read in the package.json, to later compare version.
  pack = await CliUtils.readPackageJson(rootAbsolutePath)
  t.ok(pack, 'package was parsed')
  t.ok(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

test('xtest -i (spawn)', async (t) => {
  const cmd = [executableName, '-i']
  const opts = {}
  opts.env = process.env

  const child = new XtestImmediate(cmd, opts)

  let outstr
  let errstr

  await t.test('first prompt', async (t) => {
    outstr = await child.readFromStdout()
    t.equal(outstr, '', 'stdout is empty')
    errstr = child.readFromStderr()
    t.equal(errstr, '', 'stderr is empty')
    t.end()
  })

  await t.test('--version', async (t) => {
    child.writeToInput('--version')
    outstr = await child.readFromStdout()
    t.equal(outstr, `${pack.version}\n`, 'version value')
    errstr = child.readFromStderr()
    t.equal(errstr, '', 'stderr is empty')
    t.end()
  })

  await t.test('copy -h', async (t) => {
    child.writeToInput('copy -h')
    outstr = await child.readFromStdout()
    t.match(outstr, 'Usage: xtest copy [<options>...]',
      'has code Usage')
    errstr = child.readFromStderr()
    t.equal(errstr, '', 'stderr is empty')
    t.end()
  })

  await t.test('copy', async (t) => {
    child.writeToInput('copy')
    outstr = await child.readFromStdout()
    t.match(outstr, 'Usage: xtest copy [<options>...]',
      'has code Usage')
    errstr = child.readFromStderr()
    t.match(errstr, 'Mandatory \'--file\' not found',
      '--file not found')
    t.match(errstr, 'Mandatory \'--output\' not found',
      '--output not found')
    t.end()
  })

  await t.test('xyz', async (t) => {
    child.writeToInput('xyz')
    outstr = await child.readFromStdout()
    t.match(outstr, 'Usage: xtest <command> [<options>...]',
      'has Usage')
    errstr = child.readFromStderr()
    t.match(errstr, 'Command \'xyz\' is not supported.',
      'xyz is not supported')
    t.end()
  })

  await t.test('.exit', async (t) => {
    child.writeToInput('.exit')

    const code = await child.promise
    t.equal(code, CliExitCodes.SUCCESS, 'exit code success')

    t.match(child.stdout, 'Done.', 'done')
    t.equal(child.stderr, '', 'stderr is empty')

    t.end()
  })

  t.end()
})

// ----------------------------------------------------------------------------
