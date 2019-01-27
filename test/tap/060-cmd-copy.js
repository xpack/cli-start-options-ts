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
 * Test `xtest copy`.
 */

// ----------------------------------------------------------------------------

const assert = require('assert')
const path = require('path')
const os = require('os')
const fs = require('fs')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const Common = require('../common.js').Common
const Promisifier = require('@xpack/es6-promisifier').Promisifier

// ES6: `import { CliExitCodes } from 'cli-start-options'
const CliExitCodes = require('../../index.js').CliExitCodes

assert(Common)
assert(Promisifier)
assert(CliExitCodes)

// ----------------------------------------------------------------------------

const fixtures = path.resolve(__dirname, '../fixtures')
const workFolder = path.resolve(os.tmpdir(), 'xtest-copy')
const rimrafPromise = Promisifier.promisify(require('rimraf'))
const mkdirpPromise = Promisifier.promisify(require('mkdirp'))

// Promisify functions from the Node.js callbacks library.
// New functions have similar names, but belong to `promises_`.
Promisifier.promisifyInPlace(fs, 'chmod')
Promisifier.promisifyInPlace(fs, 'readFile')

// For easy migration, inspire from the Node 10 experimental API.
// Do not use `fs.promises` yet, to avoid the warning.
const fsPromises = fs.promises_

// ----------------------------------------------------------------------------

/**
 * Test if with empty line fails with mandatory error and displays help.
 */
test('xtest copy',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.libRunXtest([
        'copy'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
      t.true(stdout.length > 0, 'has stdout')
      t.match(stdout[2], 'Usage: xtest copy [<options>...]', 'has Usage')

      // console.log(errLines)
      t.equal(stderr.length, 2, 'has two errors')
      if (stderr.length > 0) {
        t.match(stderr[0], 'Mandatory \'--file\' not found',
          'has --file error')
      }
      if (stderr.length > 1) {
        t.match(stderr[1], 'Mandatory \'--output\' not found',
          'has --output error')
      }
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test if help content includes convert options.
 */
test('xtest copy -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.cliRunXtest([
        'copy',
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
      t.true(stdout.length > 0, 'has stdout')
      if (stdout.length > 9) {
        // console.log(outLines)
        t.equal(stdout[1], 'Copy a file to another file',
          'has title')
        t.match(stdout[2], 'Usage: xtest copy [<options>...]', 'has Usage')
        t.match(stdout[4], 'Copy options:', 'has copy options')
        t.match(stdout[5], '  --file <file>  ', 'has --file')
        t.match(stdout[6], '  --output <file>  ', 'has --output')
      }
      // There should be no error messages.
      t.equal(stderr.length, 0, 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test if partial command recognised and expanded.
 */
test('xtest cop -h',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.cliRunXtest([
        'cop',
        '-h'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
      t.true(stdout.length > 0, 'has stdout')
      if (stdout.length > 9) {
        // console.log(outLines)
        t.match(stdout[1], 'Copy a file to another file',
          'has title')
        t.match(stdout[2], 'Usage: xtest copy [<options>...]', 'has Usage')
      }
      // There should be no error messages.
      t.equal(stderr.length, 0, 'stderr is empty')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test missing input file.
 */
test('xtest cop --file xxx --output yyy -q',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.cliRunXtest([
        'cop',
        '--file',
        'xxx',
        '--output',
        'yyy',
        '-q'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.ERROR.INPUT, 'exit code is input')
      // There should be no output.
      t.equal(stdout.length, 0, 'stdout is empty')
      t.equal(stderr.length, 1, 'stderr has 1 line')
      t.match(stderr[0], 'ENOENT: no such file or directory',
        'stderr is ENOENT')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

test('unpack',
  async (t) => {
    const tgzPath = path.resolve(fixtures, 'cmd-code.tgz')
    try {
      await Common.extractTgz(tgzPath, workFolder)
      t.pass('cmd-code.tgz unpacked into ' + workFolder)
      await fsPromises.chmod(filePath, 0o444)
      t.pass('chmod ro file')
      await mkdirpPromise(readOnlyFolder)
      t.pass('mkdir folder')
      await fsPromises.chmod(readOnlyFolder, 0o444)
      t.pass('chmod ro folder')
    } catch (err) {
      t.fail(err)
    }
    t.end()
  })

const filePath = path.resolve(workFolder, 'input.json')
const readOnlyFolder = path.resolve(workFolder, 'ro')

test('xtest cop --file input.json --output output.json',
  async (t) => {
    try {
      const outPath = path.resolve(workFolder, 'output.json')
      const { code, stdout, stderr } = await Common.cliRunXtest([
        'cop',
        '--file',
        filePath,
        '--output',
        outPath
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
      t.equal(stdout.length, 5, 'stdout has 5 lines')
      t.match(stdout[4], 'completed in', 'stdout is completed')
      // console.log(stdout)
      t.equal(stderr.length, 0, 'stderr is empty')
      // console.log(stderr)

      const fileContent = await fsPromises.readFile(outPath)
      t.ok(fileContent, 'content is read in')
      const json = JSON.parse(fileContent.toString())
      t.ok(json, 'json was parsed')
      t.match(json.name, '@ilg/cli-start-options', 'has name')
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

test('xtest cop --file input --output output -v',
  async (t) => {
    try {
      const { code, stdout, stderr } = await Common.cliRunXtest([
        'cop',
        '-C',
        workFolder,
        '--file',
        filePath,
        '--output',
        'output.json',
        '-v'
      ])
      // Check exit code.
      t.equal(code, CliExitCodes.SUCCESS, 'exit code')
      t.equal(stdout.length, 6, 'stdout has 6 lines')
      t.match(stdout[5], 'completed in', 'stdout is completed')
      // console.log(stdout)
      t.equal(stderr.length, 0, 'stderr is empty')
      // console.log(stderr)
    } catch (err) {
      t.fail(err.message)
    }
    t.end()
  })

// Windows R/O folders do not prevent creating new files.
if (os.platform() !== 'win32') {
  /**
   * Test output error.
   */
  test('xtest cop --file input --output ro/output -v',
    async (t) => {
      try {
        const outPath = path.resolve(workFolder, 'ro', 'output.json')
        const { code, stdout, stderr } = await Common.cliRunXtest([
          'cop',
          '--file',
          filePath,
          '--output',
          outPath,
          '-v'
        ])
        // Check exit code.
        t.equal(code, CliExitCodes.ERROR.OUTPUT, 'exit code is output')
        t.equal(stdout.length, 4, 'stdout has 4 lines')
        // Output should go up to Writing...
        // console.log(stdout)
        t.match(stdout[3], 'Writing ', 'up to writing')
        // console.log(stderr)
        t.equal(stderr.length, 1, 'stderr has 1 line')
        t.match(stderr[0], 'EACCES: permission denied', 'stderr is EACCES')
      } catch (err) {
        t.fail(err.message)
      }
      t.end()
    })
}

test('cleanup', async (t) => {
  await fsPromises.chmod(filePath, 0o666)
  t.pass('chmod rw file')
  await fsPromises.chmod(readOnlyFolder, 0o666)
  t.pass('chmod rw folder')
  await rimrafPromise(workFolder)
  t.pass('remove tmpdir')
})

// ----------------------------------------------------------------------------
