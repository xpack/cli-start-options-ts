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

/**
 * Test `xtest copy`.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/del
import { deleteAsync } from 'del'

// https://www.npmjs.com/package/make-dir
import makeDir from 'make-dir'

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

// ----------------------------------------------------------------------------

import { runLibXtest, extractTgz } from '../mock/common.js'

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.ExitCodes)

// ----------------------------------------------------------------------------

const fixtures = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), '../fixtures')
const workFolder = path.resolve(os.tmpdir(), 'xtest-copy')

const skipSomeTests = true

// ----------------------------------------------------------------------------

/**
 * Test if with empty line fails with mandatory error and displays help.
 */
await test('xtest copy',
  async (t) => {
    try {
      const { exitCode: code, stdout, stderr } = await runLibXtest([
        'copy'
      ])
      // Check exit code.
      t.equal(code, cli.ExitCodes.ERROR.SYNTAX, 'exit code is syntax')
      const errLines = stderr.split(/\r?\n/)
      // console.log(errLines)
      t.equal(errLines.length, 2 + 1, 'has two errors')
      if (errLines.length === 3) {
        t.match(errLines[0], 'Mandatory \'--file\' not found',
          'has --file error')
        t.match(errLines[1], 'Mandatory \'--output\' not found',
          'has --output error')
      }
      t.match(stdout, 'Usage: xtest copy [options...]', 'has Usage')
    } catch (err: any) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test if help content includes convert options.
 */
await test('xtest copy -h',
  async (t) => {
    try {
      const { exitCode: code, stdout, stderr } = await runLibXtest([
        'copy',
        '-h'
      ])
      // Check exit code.
      t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')
      const outLines = stdout.split(/\r?\n/)
      t.ok(outLines.length > 24, 'has enough output')
      if (outLines.length > 24) {
        // console.log(outLines)
        t.equal(outLines[1], 'Copy a file to another file',
          'has title')
        t.equal(outLines[3], 'Usage: xtest copy [options...] ' +
          '--file <file> --output <file>', 'has Usage')
        t.match(outLines[5], 'Command aliases: c', 'has aliases')
        t.match(outLines[7], 'Copy options:', 'has copy options')
        t.match(outLines[8], '  --file <file>  ', 'has --file')
        t.match(outLines[9], '  --output <file>  ', 'has --output')
      }
      // There should be no error messages.
      t.equal(stderr, '', 'stderr is empty')
    } catch (err: any) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test if partial command recognised and expanded.
 */
await test('xtest cop -h',
  async (t) => {
    try {
      const { exitCode: code, stdout, stderr } = await runLibXtest([
        'cop',
        '-h'
      ])
      // Check exit code.
      t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')
      const outLines = stdout.split(/\r?\n/)
      t.ok(outLines.length > 9, 'has enough output')
      if (outLines.length > 9) {
        // console.log(outLines)
        t.equal(outLines[1], 'Copy a file to another file',
          'has title')
        t.equal(outLines[3], 'Usage: xtest copy [options...] ' +
          '--file <file> --output <file>', 'has Usage')
      }
      // There should be no error messages.
      t.equal(stderr, '', 'stderr is empty')
    } catch (err: any) {
      t.fail(err.message)
    }
    t.end()
  })

/**
 * Test missing input file.
 */
await test('xtest cop --file xxx --output yyy -q',
  async (t) => {
    try {
      const { exitCode: code, stdout, stderr } = await runLibXtest([
        'cop',
        '--file',
        'xxx',
        '--output',
        'yyy',
        '-q'
      ])
      // Check exit code.
      t.equal(code, cli.ExitCodes.ERROR.INPUT, 'exit code is input')
      // There should be no output.
      t.equal(stdout, '', 'stdout is empty')
      t.match(stderr, 'ENOENT: no such file or directory', 'strerr is ENOENT')
    } catch (err: any) {
      t.fail(err.message)
    }
    t.end()
  })

if (!skipSomeTests) {
  await test('unpack',
    async (t) => {
      const tgzPath = path.resolve(fixtures, 'cmd-code.tgz')
      try {
        await extractTgz(tgzPath, workFolder)
        t.pass('cmd-code.tgz unpacked into ' + workFolder)
        await fs.promises.chmod(filePath, 0o444)
        t.pass('chmod ro file')
        await makeDir(readOnlyFolder)
        t.pass('mkdir folder')
        await fs.promises.chmod(readOnlyFolder, 0o444)
        t.pass('chmod ro folder')
      } catch (err: any) {
        console.log(err)
        t.fail(err)
      }
      t.end()
    })

  const readOnlyFolder = path.resolve(workFolder, 'ro')
  const filePath = path.resolve(workFolder, 'input.json')

  await test('xtest cop --file input.json --output output.json',
    async (t) => {
      try {
        const outPath = path.resolve(workFolder, 'output.json')
        const { exitCode: code, stdout, stderr } = await runLibXtest([
          'cop',
          '--file',
          filePath,
          '--output',
          outPath
        ])
        // Check exit code.
        t.equal(code, cli.ExitCodes.SUCCESS, 'exit code is success')
        t.match(stdout, 'Done', 'stdout is done')
        // console.log(stdout)
        t.equal(stderr, '', 'stderr is empty')
        // console.log(stderr)

        const fileContent = await fs.promises.readFile(outPath)
        t.ok(fileContent, 'content is read in')
        const json = JSON.parse(fileContent.toString())
        t.ok(json, 'json was parsed')
        t.match(json.name, '@ilg/cli-start-options', 'has name')
      } catch (err: any) {
        t.fail(err.message)
      }
      t.end()
    })

  await test('xtest cop --file input --output output -v',
    async (t) => {
      try {
        const { exitCode: code, stdout, stderr } = await runLibXtest([
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
        t.equal(code, cli.ExitCodes.SUCCESS, 'exit code')
        t.match(stdout, 'Done.', 'message is Done')
        // console.log(stdout)
        t.equal(stderr, '', 'stderr is empty')
      // console.log(stderr)
      } catch (err: any) {
        t.fail(err.message)
      }
      t.end()
    })

  // Windows R/O folders do not prevent creating new files.
  if (os.platform() !== 'win32') {
    /**
     * Test output error.
     */
    await test('xtest cop --file input --output ro/output -v',
      async (t) => {
        try {
          const outPath = path.resolve(workFolder, 'ro', 'output.json')
          const { exitCode: code, stdout, stderr } = await runLibXtest([
            'cop',
            '--file',
            filePath,
            '--output',
            outPath,
            '-v'
          ])
          // Check exit code.
          t.equal(code, cli.ExitCodes.ERROR.OUTPUT, 'exit code is output')
          // Output should go up to Writing...
          // console.log(stdout)
          t.match(stdout, 'Writing ', 'up to writing')
          // console.log(stderr)
          t.match(stderr, 'EACCES: permission denied', 'stderr is EACCES')
        } catch (err: any) {
          t.fail(err.message)
        }
        t.end()
      })
  }

  await test('cleanup', async (t) => {
    await fs.promises.chmod(filePath, 0o666)
    t.pass('chmod rw file')
    await fs.promises.chmod(readOnlyFolder, 0o666)
    t.pass('chmod rw folder')
    await deleteAsync(workFolder)
    t.pass('remove tmpdir')
  })
}

// ----------------------------------------------------------------------------
