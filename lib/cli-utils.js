/*
 * This file is part of the xPack distribution
 *   (http://xpack.github.io).
 * Copyright (c) 2018 Liviu Ionescu.
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
const os = require('os')
const path = require('path')
const fs = require('fs')

// https://www.npmjs.com/package/del
const del = require('del')

// https://www.npmjs.com/package/mkdirp-promise
const mkdir = require('mkdirp-promise')

// ----------------------------------------------------------------------------

const Promisifier = require('@xpack/es6-promisifier').Promisifier

// Promisify functions from the Node.js callbacks library.
// New functions have similar names, but belong to `promises_`.
Promisifier.promisifyInPlace(fs, 'readFile')
Promisifier.promisifyInPlace(fs, 'symlink')

// For easy migration, inspire from the Node 10 experimental API.
// Do not use `fs.promises` yet, to avoid the warning.
const fsPromises = fs.promises_

// ============================================================================

class CliUtils {
  /**
   * @summary Read package JSON file.
   *
   * @param {string} folderAbsolutePath The absolute path of the package.
   * @returns {Object} The package definition, unmodified.
   * @throws Error from `fs.readFile()` or `JSON.parse()`.
   *
   * @static
   * @description
   * By default, this function uses the package root path
   * stored in the class property during initialisation.
   * When called from tests, the path must be passed explicitly.
   */
  static async readPackageJson (folderAbsolutePath) {
    assert(folderAbsolutePath)

    const filePath = path.join(folderAbsolutePath, 'package.json')
    const fileContent = await fsPromises.readFile(filePath)
    assert(fileContent !== null)
    return JSON.parse(fileContent.toString())
  }

  /**
   * @summary Convert a duration in ms to seconds if larger than 1000.
   *
   * @static
   * @param {number} n Duration in milliseconds.
   * @returns {String} Value in ms or sec.
   */
  static formatDuration (n) {
    if (n < 1000) {
      return `${n} ms`
    }
    return `${(n / 1000).toFixed(3)} sec`
  }

  static formatSize (bytes) {
    if (bytes < (1024 + 512)) {
      return `${bytes} B`
    }
    if (bytes < (1024 + 512) * 1024) {
      const kbytes = Math.round((bytes + 512) / 1024)
      return `${kbytes} kB`
    }
    const mbytes = Math.round((bytes + 512 * 1024) / 1024 / 1024)
    return `${mbytes} MB`
  }

  static async createFolderLink (
    { linkPath, sourcePath, hasWinSymLink = false }) {
    assert(linkPath)
    assert(sourcePath)

    await del(linkPath, { force: true })

    const parentPath = path.dirname(linkPath)
    await mkdir(parentPath)

    /* istanbul ignore next */
    const symlinkType = os.platform() === 'win32'
      ? (hasWinSymLink ? 'dir' : 'junction') : 'dir'

    // fs.symlink(target, path, type)
    // Creates the link called path -> target
    // Relative targets are relative to the link’s parent directory
    // Windows junction points require the destination path to be absolute.
    // When using 'junction', the target argument will automatically be
    // normalized to absolute path.
    await fsPromises.symlink(sourcePath, linkPath, symlinkType)
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The class is added as a property of this object.
module.exports.CliUtils = CliUtils

// In ES6, it would be:
// export class CliUtils { ... }
// ...
// import { CliUtils } from '../utils/cli-utils.js'

// ----------------------------------------------------------------------------
