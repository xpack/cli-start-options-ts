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

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const CliUtils = require('../../index.js').CliUtils

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

// ----------------------------------------------------------------------------
