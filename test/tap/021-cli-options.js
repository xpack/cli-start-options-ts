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
 * Test custom errors.
 */

// ----------------------------------------------------------------------------

// const assert = require('assert')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const CliOptions = require('../../index.js').CliOptions
const MockLog = require('../common.js').MockLog

// ----------------------------------------------------------------------------

test('asserts', (t) => {
  t.true(CliOptions !== undefined, 'CliOptions is defined')

  t.end()
})

test('filterOwnArguments', (t) => {
  const log = new MockLog()
  const cliOptions = new CliOptions({
    log: log,
    object: {}
  })
  let arr

  arr = cliOptions.filterOwnArguments([
    'one',
    'two'
  ])
  t.equal(arr.length, 2, '2 own arguments')
  t.equal(arr[0], 'one', 'is one')
  t.equal(arr[1], 'two', 'is two')

  arr = cliOptions.filterOwnArguments([
    'one',
    'two',
    '--'
  ])
  t.equal(arr.length, 2, '2 own arguments')
  t.equal(arr[0], 'one', 'is one')
  t.equal(arr[1], 'two', 'is two')

  arr = cliOptions.filterOwnArguments([
    'one',
    'two',
    '--',
    'three'
  ])
  t.equal(arr.length, 2, '2 own arguments')
  t.equal(arr[0], 'one', 'is one')
  t.equal(arr[1], 'two', 'is two')

  arr = cliOptions.filterOwnArguments([
    '--one',
    'two',
    '--',
    'three'
  ])
  t.equal(arr.length, 2, '2 own arguments')
  t.equal(arr[0], '--one', 'is --one')
  t.equal(arr[1], 'two', 'is two')

  arr = cliOptions.filterOwnArguments([
    '--one',
    'two',
    '--',
    'three',
    '--four'
  ])
  t.equal(arr.length, 2, '2 own arguments')
  t.equal(arr[0], '--one', 'is --one')
  t.equal(arr[1], 'two', 'is two')

  arr = cliOptions.filterOwnArguments([
    '--one',
    'two',
    '--',
    'three',
    '--'
  ])
  t.equal(arr.length, 2, '2 own arguments')
  t.equal(arr[0], '--one', 'is --one')
  t.equal(arr[1], 'two', 'is two')

  t.end()
})

test('filterOtherArguments', (t) => {
  const log = new MockLog()
  const cliOptions = new CliOptions({
    log: log,
    object: {}
  })
  let arr

  arr = cliOptions.filterOtherArguments([
    'one',
    'two'
  ])
  t.equal(arr.length, 0, 'no other arguments')

  arr = cliOptions.filterOtherArguments([
    'one',
    'two',
    '--'
  ])
  t.equal(arr.length, 0, 'no other arguments')

  arr = cliOptions.filterOtherArguments([
    'one',
    'two',
    '--',
    'three'
  ])
  t.equal(arr.length, 1, '1 other argument')
  t.equal(arr[0], 'three', 'is three')

  arr = cliOptions.filterOtherArguments([
    '--one',
    'two',
    '--',
    'three'
  ])
  t.equal(arr.length, 1, '1 other argument')
  t.equal(arr[0], 'three', 'is three')

  arr = cliOptions.filterOtherArguments([
    '--one',
    'two',
    '--',
    'three',
    '--four'
  ])
  t.equal(arr.length, 2, '2 other arguments')
  t.equal(arr[0], 'three', 'is three')
  t.equal(arr[1], '--four', 'is --four')

  arr = cliOptions.filterOtherArguments([
    '--one',
    'two',
    '--',
    'three',
    '--'
  ])
  t.equal(arr.length, 2, '2 other argument2')
  t.equal(arr[0], 'three', 'is three')
  t.equal(arr[1], '--', 'is --')

  t.end()
})

// ----------------------------------------------------------------------------
