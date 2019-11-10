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

const assert = require('assert')

// The `[node-tap](http://www.node-tap.org)` framework.
const test = require('tap').test

const CmdsTree = require('../../index.js').CmdsTree

// ----------------------------------------------------------------------------

test('asserts', (t) => {
  t.true(CmdsTree !== undefined, 'CmdsTree is defined')
  t.true(CmdsTree.charTerminator !== undefined,
    'CmdsTree.charTerminator is defined')

  t.end()
})

test('two commands', (t) => {
  const cmdsTree = new CmdsTree()
  cmdsTree.addCommands({
    copy: {
      modulePath: 'copy.js',
      className: 'Copy'
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  t.true(cmdsTree.hasCommands(), 'tree has commands')

  const cmds = cmdsTree.getCommandsNames()
  t.equal(cmds.length, 2, 'tree has 2 commands')

  // Results are sorted.
  t.equal(cmds[0], 'conf', 'first is conf')
  t.equal(cmds[1], 'copy', 'second is copy')

  cmdsTree.buildCharTrees()
  t.equal(cmdsTree.endCharNode.length, 2, 'has 2 end nodes')

  let cmd
  let arr
  cmd = cmdsTree.findCommands(['copy'])
  t.equal(cmd.modulePath, 'copy.js', 'copy module is copy.js')
  t.equal(cmd.className, 'Copy', 'copy class is Copy')

  arr = cmd.fullCommandsArray()
  t.equal(arr.length, 1, 'full array has one entry')
  t.equal(arr[0], 'copy', 'first command is copy')

  cmd = cmdsTree.findCommands(['conf'])
  t.equal(cmd.modulePath, 'conf.js', 'conf module is conf.js')
  t.equal(cmd.className, undefined, 'conf class is not defined')

  arr = cmd.fullCommandsArray()
  t.equal(arr.length, 1, 'full array has one entry')
  t.equal(arr[0], 'conf', 'first command is conf')

  cmd = cmdsTree.findCommands(['cop'])
  t.equal(cmd.modulePath, 'copy.js', 'cop module is copy.js')

  cmd = cmdsTree.findCommands(['con'])
  t.equal(cmd.modulePath, 'conf.js', 'con module is conf.js')

  cmd = cmdsTree.findCommands(['copyy'])
  t.equal(cmd.modulePath, 'copy.js', 'copyy module is copy.js')

  cmd = cmdsTree.findCommands(['conff'])
  t.equal(cmd.modulePath, 'conf.js', 'conff module is conf.js')

  try {
    cmd = cmdsTree.findCommands(['co'])
    t.fail('co did not throw')
  } catch (ex) {
    t.match(ex.message, 'not unique', 'co throws not unique')
  }

  try {
    cmd = cmdsTree.findCommands(['ca'])
    t.fail('ca did not throw')
  } catch (ex) {
    t.match(ex.message, 'not supported', 'ca throws not supported')
  }

  t.end()
})

test('duplicate commands', (t) => {
  const cmdsTree = new CmdsTree()
  cmdsTree.addCommands({
    copy: {
      modulePath: 'copy.js'
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  const cmds = cmdsTree.getCommandsNames()
  t.equal(cmds.length, 2, 'has 2 commands')

  try {
    cmdsTree.addCommands({
      copy: {
        modulePath: 'copy.js'
      }
    })
    t.fail('duplicate copy did not throw')
  } catch (ex) {
    if (ex instanceof assert.AssertionError) {
      t.match(ex.message, 'Duplicate command', 'throws duplicate')
    }
  }

  t.end()
})

test('aliases', (t) => {
  const cmdsTree = new CmdsTree()
  cmdsTree.addCommands({
    build: {
      aliases: ['b', 'bild'],
      modulePath: 'build.js'
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  const cmds = cmdsTree.getCommandsNames()
  t.equal(cmds.length, 2, 'has 2 commands')

  // Results are sorted.
  t.equal(cmds[0], 'build', 'first is build')
  t.equal(cmds[1], 'conf', 'second is conf')

  cmdsTree.buildCharTrees()
  t.equal(cmdsTree.endCharNode.length, 4, 'has 4 end nodes')

  let cmd
  cmd = cmdsTree.findCommands(['build'])
  t.equal(cmd.modulePath, 'build.js', 'build module is build.js')

  const arr = cmd.fullCommandsArray()
  t.equal(arr.length, 1, 'full array has one entry')
  t.equal(arr[0], 'build', 'first command is build')

  cmd = cmdsTree.findCommands(['bild'])
  t.equal(cmd.modulePath, 'build.js', 'bild module is build.js')

  cmd = cmdsTree.findCommands(['b'])
  t.equal(cmd.modulePath, 'build.js', 'b module is build.js')

  cmd = cmdsTree.findCommands(['bi'])
  t.equal(cmd.modulePath, 'build.js', 'bi module is build.js')

  cmd = cmdsTree.findCommands(['bildu'])
  t.equal(cmd.modulePath, 'build.js', 'bildu module is build.js')

  cmd = cmdsTree.findCommands(['conf'])
  t.equal(cmd.modulePath, 'conf.js', 'conf module is conf.js')

  t.end()
})

test('mixed aliases', (t) => {
  const cmdsTree = new CmdsTree()
  cmdsTree.addCommands({
    build: {
      aliases: ['c', 'cild'],
      modulePath: 'build.js'
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  const cmds = cmdsTree.getCommandsNames()
  t.equal(cmds.length, 2, 'has 2 commands')

  // Results are sorted.
  t.equal(cmds[0], 'build', 'first is build')
  t.equal(cmds[1], 'conf', 'second is conf')

  cmdsTree.buildCharTrees()
  t.equal(cmdsTree.endCharNode.length, 4, 'has 4 end nodes')

  let cmd
  cmd = cmdsTree.findCommands(['build'])
  t.equal(cmd.modulePath, 'build.js', 'build module is build.js')

  const arr = cmd.fullCommandsArray()
  t.equal(arr.length, 1, 'full array has one entry')
  t.equal(arr[0], 'build', 'first command is build')

  cmd = cmdsTree.findCommands(['cild'])
  t.equal(cmd.modulePath, 'build.js', 'cild module is build.js')

  cmd = cmdsTree.findCommands(['ci'])
  t.equal(cmd.modulePath, 'build.js', 'ci module is build.js')

  cmd = cmdsTree.findCommands(['c'])
  t.equal(cmd.modulePath, 'build.js', 'c module is build.js')

  cmd = cmdsTree.findCommands(['cildu'])
  t.equal(cmd.modulePath, 'build.js', 'cildu module is build.js')

  cmd = cmdsTree.findCommands(['conf'])
  t.equal(cmd.modulePath, 'conf.js', 'conf module is conf.js')

  cmd = cmdsTree.findCommands(['co'])
  t.equal(cmd.modulePath, 'conf.js', 'co module is conf.js')

  t.end()
})

test('two commands two subcommands', (t) => {
  const cmdsTree = new CmdsTree()
  cmdsTree.addCommands({
    copy: {
      modulePath: 'copy.js',
      subCommands: {
        binary: {
          modulePath: 'copyBin.js'
        },
        ascii: {
          modulePath: 'copyAsc.js'
        }
      }
    },
    conf: {
      modulePath: 'conf.js'
    }
  })

  const cmds = cmdsTree.getCommandsNames()
  t.equal(cmds.length, 2, 'has 2 commands')

  // Results are sorted.
  t.equal(cmds[0], 'conf', 'first is conf')
  t.equal(cmds[1], 'copy', 'second is copy')

  cmdsTree.buildCharTrees()
  t.equal(cmdsTree.endCharNode.length, 2, 'has 2 end nodes')

  let cmd
  let arr
  cmd = cmdsTree.findCommands(['copy'])
  t.equal(cmd.modulePath, 'copy.js', 'copy module is copy.js')

  arr = cmd.fullCommandsArray()
  t.equal(arr.length, 1, 'full array has one entry')
  t.equal(arr[0], 'copy', 'first command is copy')

  cmd = cmdsTree.findCommands(['copy', 'binary'])
  t.equal(cmd.modulePath, 'copyBin.js', 'copy binary module is copyBin.js')

  arr = cmd.fullCommandsArray()
  t.equal(arr.length, 2, 'full array has 2 entries')
  t.equal(arr[0], 'copy', 'first command is copy')
  t.equal(arr[1], 'binary', 'second command is binary')

  cmd = cmdsTree.findCommands(['copy', 'ascii'])
  t.equal(cmd.modulePath, 'copyAsc.js', 'copy ascii module is copyAsc.js')

  arr = cmd.fullCommandsArray()
  t.equal(arr.length, 2, 'full array has 2 entries')
  t.equal(arr[0], 'copy', 'first command is copy')
  t.equal(arr[1], 'ascii', 'second command is ascii')

  cmd = cmdsTree.findCommands(['conf'])
  t.equal(cmd.modulePath, 'conf.js', 'conf module is conf.js')

  arr = cmd.fullCommandsArray()
  t.equal(arr.length, 1, 'full array has one entry')
  t.equal(arr[0], 'conf', 'first command is conf')

  t.end()
})

// ----------------------------------------------------------------------------
