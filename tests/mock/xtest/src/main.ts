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
 * The Xtest main module.
 *
 * It is re-exported publicly by `index.js`.
 *
 * To import classes from this module into Node.js applications, use:
 *
 * ```javascript
 * const Xtest = require('xtest').Xtest
 * ```
 */

// ----------------------------------------------------------------------------

import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

import * as cli from '../../../../esm/index.js'

// ============================================================================

interface XtestConfig extends cli.Configuration {
  extra: boolean
}

export class Xtest extends cli.Application {
  // --------------------------------------------------------------------------

  constructor (params: cli.ApplicationConstructorParams) {
    super(params)

    const context: cli.Context = this.context

    // Mandatory, must be set here, not in the library, since it computes
    // the root path as relative to the path of this file..
    context.rootPath =
      path.dirname(path.dirname(fileURLToPath(import.meta.url)))

    // Enable REPL
    this.enableREPL = true

    // To enable server mode: --interactive-server-port 9999
    // or statically with:
    // staticThis.interactiveServerPort = 9999

    // ------------------------------------------------------------------------
    // Initialise the tree of known commands.
    // Paths should be relative to the package root.
    this.commandsTree.addCommand(['copy', 'c'], 'src/xtest/copy.js')
    this.commandsTree.addCommand(['notclass'], 'src/xtest/not-class.js')
    // Non existent.
    this.commandsTree.addCommand(['con'], 'src/xtest/con.js')
    this.commandsTree.addCommand(['verbosity', 'c'], 'src/xtest/verbosity.js')
    this.commandsTree.addCommand(['long'], 'src/xtest/long.js')
    this.commandsTree.addCommand(['many'], 'src/xtest/many.js')
    this.commandsTree.addCommand(['gen'], 'src/xtest/generator.js')
    this.commandsTree.addCommand(['unimpl'], 'src/xtest/unimpl.js')
    this.commandsTree.addCommand(['cwd'], 'src/xtest/cwd.js')

    // The common options were already initialised by the caller,
    // and are ok, no need to redefine them.
    context.options.addGroups(
      [
        {
          title: 'Extra options',
          isCommon: true,
          optionsDefinitions: [
            {
              options: ['--extra', '--very-extra', '--very-long-extra'],
              message: 'Extra options',
              action: (context) => {
                (context.config as XtestConfig).extra = true
              },
              init: (context) => {
                (context.config as XtestConfig).extra = false
              },
              isOptional: true,
              isRequiredEarly: true
            }
          ]
        }
      ])
  }
}

// ----------------------------------------------------------------------------
