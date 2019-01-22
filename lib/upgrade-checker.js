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
const fs = require('fs')
const path = require('path')
const latestVersion = require('latest-version')
const semverDiff = require('semver-diff')
const isInstalledGlobally = require('is-installed-globally')
const isPathInside = require('is-path-inside')
const isCi = require('is-ci')
const del = require('del')
const mkdirp = require('async-mkdirp')

// ----------------------------------------------------------------------------

// ES6: `import { Promisifier} from 'es6-promisifier'
const Promisifier = require('@ilg/es6-promisifier').Promisifier

// Promisify functions from the Node.js callbacks library.
// New functions have similar names, but belong to `promises_`.
Promisifier.promisifyInPlace(fs, 'open')
Promisifier.promisifyInPlace(fs, 'close')
Promisifier.promisifyInPlace(fs, 'stat')

// For easy migration, inspire from the Node 10 experimental API.
// Do not use `fs.promises` yet, to avoid the warning.
const fsPromises = fs.promises_

// ----------------------------------------------------------------------------

const userHome = require('user-home')
const timestampsPath = path.join(userHome, '.config', 'timestamps')
const timestampSuffix = '-update-check'

// ============================================================================

// export
class UpgradeChecker {
  // --------------------------------------------------------------------------

  // Constructor: use parent definition.
  constructor (params) {
    assert(params, 'There must be params.')

    assert(params.object)
    assert(params.object.log)
    assert(params.object.package)
    assert(params.object.package.name)

    this.object = params.object
  }

  async didIntervalExpire_ (deltaSeconds) {
    const object = this.object
    const log = object.log

    const fpath = path.join(timestampsPath, object.package.name +
      timestampSuffix)
    try {
      const stats = await fsPromises.stat(fpath)
      if (stats.mtime) {
        const crtDelta = Date.now() - stats.mtime
        if (crtDelta < (deltaSeconds * 1000)) {
          log.trace('update timeout did not expire ' +
            `${Math.floor(crtDelta / 1000)} < ${deltaSeconds}`)
          return false
        }
      }
    } catch (ex) {
      log.trace('no previous update timestamp')
    }
    return true
  }

  async getLatestVersion () {
    // Explicit uppercase, to be obvious when a static property/method is used.

    const object = this.object
    // const config = object.config
    const log = object.log

    if (!this.checkUpdatesIntervalSeconds ||
      this.checkUpdatesIntervalSeconds === 0 ||
      isCi ||
      !process.stdout.isTTY ||
      'NO_UPDATE_NOTIFIER' in process.env) {
      log.trace('do not fetch latest version number.')
      return
    }

    if (await this.didIntervalExpire_(this.checkUpdatesIntervalSeconds)) {
      log.trace('fetching latest version number...')
      // At this step only create the promise,
      // its result will be checked before exit.
      this.latestVersionPromise = latestVersion(object.package.name)
    }
  }

  async checkUpdate () {
    const object = this.object
    const log = object.log

    if (!this.latestVersionPromise) {
      // If the promise was not created, no action.
      return
    }

    const ver = await this.latestVersionPromise
    log.trace(`${object.package.version} → ${ver}`)

    if (semverDiff(object.package.version, ver)) {
      // If versions differ, notify user.
      let isGlobal = isInstalledGlobally ? ' --global' : ''

      let msg = '\n'
      msg += `>>> New version ${object.package.version} -> `
      msg += `${ver} available. <<<\n`
      msg += ">>> Run '"
      if (os.platform() !== 'win32') {
        if (isInstalledGlobally && isPathInside(__dirname, '/usr/local')) {
          // May not be very reliable if installed in another system location.
          msg += 'sudo '
        }
      }
      msg += `npm install ${object.package.name}${isGlobal}' to update. <<<`
      log.info(msg)
    }

    if (process.geteuid && process.geteuid() !== process.getuid()) {
      // If running as root, skip writing the timestamp to avoid
      // later EACCES or EPERM.
      log.trace(`geteuid() ${process.geteuid()} != ${process.getuid()}`)
      return
    }

    await mkdirp(timestampsPath)

    const fpath = path.join(timestampsPath, object.package.name +
      timestampSuffix)
    await del(fpath, { force: true })

    // Create an empty file, only the modified date is checked.
    const fd = await fsPromises.open(fpath, 'w')
    await fsPromises.close(fd)

    log.debug('timestamp created')
  }
}

// ----------------------------------------------------------------------------
// Node.js specific export definitions.

// By default, `module.exports = {}`.
// The class is added as a property to this object.

module.exports.UpgradeChecker = UpgradeChecker

// In ES6, it would be:
// export class UpgradeChecker { ... }
// ...
// import { UpgradeChecker } from 'upgrade-checker.js'

// ----------------------------------------------------------------------------
