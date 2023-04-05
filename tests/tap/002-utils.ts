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

/*
 * Test the utilities.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
// import * as fs from 'node:fs'
// import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// https://www.npmjs.com/package/del
// import { deleteAsync } from 'del'

// https://www.npmjs.com/package/make-dir
// import makeDir from 'make-dir'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.readPackageJson)
assert(cli.formatDuration)
assert(cli.formatSize)

// ----------------------------------------------------------------------------

await test('readPackageJson', async (t) => {
  const rootPath = path.dirname(path.dirname(path.dirname(
    fileURLToPath(import.meta.url))))
  const json = await cli.readPackageJson(rootPath)
  t.ok(json, 'has json')
  t.equal(json.name, '@xpack/cli-start-options', 'name is right')
  t.ok(json.version, 'version is present')

  t.end()
})

await test('formatDuration', (t) => {
  t.equal(cli.formatDuration(1), '1 ms', '1 ms')
  t.equal(cli.formatDuration(999), '999 ms', '999 ms')

  t.equal(cli.formatDuration(1000), '1.000 sec', '1.000 sec')
  t.equal(cli.formatDuration(1499), '1.499 sec', '1.499 sec')
  t.equal(cli.formatDuration(1500), '1.500 sec', '1.500 sec')
  t.equal(cli.formatDuration(1999), '1.999 sec', '1.999 sec')

  t.end()
})

await test('formatSize', (t) => {
  t.equal(cli.formatSize(1), '1 B', '1 B')
  t.equal(cli.formatSize(1024 + 512 - 1), '1535 B', '1535 B')
  t.equal(cli.formatSize(1024 + 512), '2 kB', '2 kB')
  t.equal(cli.formatSize(1024 * (1024 + 512) - 1), '1536 kB', '1536 kB')
  t.equal(cli.formatSize(1024 * (1024 + 512)), '2 MB', '2 MB')

  t.end()
})

// test('createFolderLink', async (t) => {
//   const tmpFolderPath = os.tmpdir()
//   const tmpUtilsFolderPath = path.join(tmpFolderPath, 'utils')
//   await deleteAsync(tmpUtilsFolderPath, { force: true })

//   await makeDir(tmpUtilsFolderPath)

//   const linkName = 'link'
//   const linkPath = path.join(tmpUtilsFolderPath, linkName)

//   const sourcePath = path.join(tmpFolderPath, 'source')
//   await makeDir(sourcePath)

//   try {
//     await cli.createFolderLink({ linkPath, sourcePath })
//     t.pass('link created')

//     try {
//       const stats = await fs.promises.stat(linkPath)

//       t.ok(stats.isDirectory(), 'stat is folder')
//     } catch (err) {
//       t.fail('stat failed ' + err.message)
//     }

//     try {
//       const stats = await fs.promises.lstat(linkPath)

//       t.ok(stats.isSymbolicLink(), 'lstat is symlink')
//     } catch (err) {
//       t.fail('lstat failed ' + err.message)
//     }

//     try {
//       const dirents = await fs.promises.readdir(
//         tmpUtilsFolderPath, { withFileTypes: true })
//       // console.log(dirents)
//       for (const dirent of dirents) {
//         if (dirent.name === linkName) {
//           t.ok(dirent.isSymbolicLink(), 'dirent is symlink')
//         }
//       }
//     } catch (err) {
//       t.fail('readdir failed ' + err.message)
//     }
//   } catch (err) {
//     t.fail('link failed ' + err.message)
//   }

//   t.end()
// })

// ----------------------------------------------------------------------------
