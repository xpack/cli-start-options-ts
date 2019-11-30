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
 * Test the data model for storing and processing commands.
 */

// ----------------------------------------------------------------------------

// const assert = require('assert')
const path = require('path')
const os = require('os')
const fs = require('fs')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

// https://www.npmjs.com/package/del
const del = require('del')

// https://www.npmjs.com/package/mkdirp-promise
const mkdir = require('mkdirp-promise')

const CliUtils = require('../../index.js').CliUtils

// ----------------------------------------------------------------------------

const Promisifier = require('@xpack/es6-promisifier').Promisifier

// Promisify functions from the Node.js callbacks library.
// New functions have similar names, but belong to `promises_`.
Promisifier.promisifyInPlace(fs, 'lstat')
Promisifier.promisifyInPlace(fs, 'stat')
Promisifier.promisifyInPlace(fs, 'readdir')

// For easy migration, inspire from the Node 10 experimental API.
// Do not use `fs.promises` yet, to avoid the warning.
const fsPromises = fs.promises_

// ----------------------------------------------------------------------------

test('asserts', (t) => {
  t.true(CliUtils !== undefined, 'CliUtils is defined')

  t.end()
})

test('readPackageJson', async (t) => {
  const rootPath = path.dirname(path.dirname(__dirname))
  const json = await CliUtils.readPackageJson(rootPath)
  t.true(json, 'has json')
  t.equal(json.name, '@ilg/cli-start-options', 'name is right')
  t.true(json.version, 'version is present')

  t.end()
})

test('formatDuration', (t) => {
  t.equal(CliUtils.formatDuration(1), '1 ms', '1 ms')
  t.equal(CliUtils.formatDuration(999), '999 ms', '999 ms')

  t.equal(CliUtils.formatDuration(1000), '1.000 sec', '1.000 sec')
  t.equal(CliUtils.formatDuration(1499), '1.499 sec', '1.499 sec')
  t.equal(CliUtils.formatDuration(1500), '1.500 sec', '1.500 sec')
  t.equal(CliUtils.formatDuration(1999), '1.999 sec', '1.999 sec')

  t.end()
})

test('formatSize', (t) => {
  t.equal(CliUtils.formatSize(1), '1 B', '1 B')
  t.equal(CliUtils.formatSize(1024 + 512 - 1), '1535 B', '1535 B')
  t.equal(CliUtils.formatSize(1024 + 512), '2 kB', '2 kB')
  t.equal(CliUtils.formatSize(1024 * (1024 + 512) - 1), '1536 kB', '1536 kB')
  t.equal(CliUtils.formatSize(1024 * (1024 + 512)), '2 MB', '2 MB')

  t.end()
})

test('createFolderLink', async (t) => {
  const tmpFolderPath = os.tmpdir()
  const tmpUtilsFolderPath = path.join(tmpFolderPath, 'utils')
  await del(tmpUtilsFolderPath, { force: true })

  await mkdir(tmpUtilsFolderPath)

  const linkName = 'link'
  const linkPath = path.join(tmpUtilsFolderPath, linkName)

  const sourcePath = path.join(tmpFolderPath, 'source')
  await mkdir(sourcePath)

  try {
    await CliUtils.createFolderLink({ linkPath, sourcePath })
    t.pass('link created')

    try {
      const stats = await fsPromises.stat(linkPath)

      t.true(stats.isDirectory(), 'stat is folder')
    } catch (err) {
      t.fail('stat failed ' + err.message)
    }

    try {
      const stats = await fsPromises.lstat(linkPath)

      t.true(stats.isSymbolicLink(), 'lstat is symlink')
    } catch (err) {
      t.fail('lstat failed ' + err.message)
    }

    try {
      const dirents = await fsPromises.readdir(
        tmpUtilsFolderPath, { withFileTypes: true })
      // console.log(dirents)
      for (const dirent of dirents) {
        if (dirent.name === linkName) {
          t.true(dirent.isSymbolicLink(), 'dirent is symlink')
        }
      }
    } catch (err) {
      t.fail('readdir failed ' + err.message)
    }
  } catch (err) {
    t.fail('link failed ' + err.message)
  }

  t.end()
})

// ----------------------------------------------------------------------------
