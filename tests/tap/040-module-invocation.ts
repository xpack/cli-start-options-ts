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

/**
 * Test the direct invocation as a module.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// The `[node-tap](http://www.node-tap.org)` framework.
import { test } from 'tap'

// ----------------------------------------------------------------------------

// The Mocha-like DSL http://www.node-tap.org/mochalike/
// require('tap').mochaGlobals()
// const should = require('should') // eslint-disable-line no-unused-vars
// /* global describe, context, it */

import { Common, mockPath } from '../mock/common.js'

import {
  CliApplication,
  CliExitCodes,
  NpmPackageJson
} from '../../src/index.js'

// ----------------------------------------------------------------------------

assert(Common)
assert(CliApplication)
assert(CliExitCodes)

// ----------------------------------------------------------------------------

let pack: NpmPackageJson

// ----------------------------------------------------------------------------

await test('setup', async (t) => {
  // Read in the package.json, to later compare version.
  const rootPath = mockPath('xtest')
  pack = await CliApplication.readPackageJson(rootPath)
  t.ok(pack, 'package parsed')
  t.ok(pack.version.length > 0, 'version length > 0')
  t.pass(`package ${pack.name}@${pack.version}`)
  t.end()
})

await test('xtest --version (module call)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestLib([
      '--version'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.SUCCESS, 'exit code is success')
    // Check if version matches the package.
    // Beware, the stdout string has a new line terminator.
    t.equal(stdout, pack.version + '\n', 'version value')
    // There should be no error messages.
    t.equal(stderr, '', 'stderr is empty')
  } catch (err: any) {
    console.log(err.stack)
    t.fail(err.message)
  }
  t.end()
})

await test('xtest xyz (module call)', async (t) => {
  try {
    const { code, stdout, stderr } = await Common.xtestLib([
      'xyz'
    ])
    // Check exit code.
    t.equal(code, CliExitCodes.ERROR.SYNTAX, 'exit code is syntax')
    t.match(stdout, 'Usage: xtest <command>', 'has Usage')
    // There should be one error message.
    t.match(stderr, 'Command \'xyz\' not supported.', 'error')
  } catch (err: any) {
    console.log(err.stack)
    t.fail(err.message)
  }
  t.end()
})

/*
describe('setup', () => {
  context('when reading package.json', async function () {
    // Read in the package.json, to later compare version.
    pack = await CliApplication.readPackageJson()
    it('json object exists', () => { pack.should.not.equal(null) })
    it('version string is not empty', () => {
      pack.version.should.be.type('string').and.not.be.empty() })
  })
})
*/

// ----------------------------------------------------------------------------
