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

const path = require('path')
const assert = require('assert')
const fs = require('fs')

// ----------------------------------------------------------------------------

const Promisifier = require('@xpack/es6-promisifier').Promisifier

// Promisify functions from the Node.js callbacks library.
// New functions have similar names, but belong to `promises_`.
Promisifier.promisifyInPlace(fs, 'readFile')

// For easy migration, inspire from the Node 10 experimental API.
// Do not use `fs.promises` yet, to avoid the warning.
const fsPromises = fs.promises_

// ============================================================================

class CliUtil {
  /**
   * @summary Read package JSON file.
   *
   * @param {string} rootAbsolutePath The absolute path of the package.
   * @returns {Object} The package definition, unmodified.
   * @throws Error from `fs.readFile()` or `JSON.parse()`.
   *
   * @static
   * @description
   * By default, this function uses the package root path
   * stored in the class property during initialisation.
   * When called from tests, the path must be passed explicitly.
   */
  static async readPackageJson (rootAbsolutePath) {
    const filePath = path.join(rootAbsolutePath, 'package.json')
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
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The class is added as a property of this object.
module.exports.CliUtil = CliUtil

// In ES6, it would be:
// export class CliUtil { ... }
// ...
// import { CliUtil } from '../utils/cli-util.js'

// ----------------------------------------------------------------------------
