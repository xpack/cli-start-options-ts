/*
 * This file is part of the xPack distribution
 *   (http://xpack.github.io).
 * Copyright (c) 2019 Liviu Ionescu.
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

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import {
  CliApplication,
  CliExitCodes,
  CliErrorSyntax,
  CliErrorApplication
} from '../../../dist/index.js'

class MyApp extends CliApplication {
  constructor (params) {
    super(params)

    // ------------------------------------------------------------------------
    // Mandatory, must be set here.
    // It should point to the folder where `package.json` is.
    // The `path.dirname()` is necessary because this file is in `lib`,
    // not directly in root.
    this.rootAbsolutePath = path.dirname(__dirname)

    // Text to be shown on the first line of the output, in verbose mode.
    this.helpOptions.applicationGreeting = 'The greatest CLI Application'

    // Enable this to prevent the greeting being displayed automatically.
    // this.config.skipGreeting = true
  }

  async doRun (args) {
    const log = this.log
    log.trace(`MyApp.doRun(${args})`)

    // Enable this to always display the greeting, not only in verbose mode.
    // this.outputGreeting()

    // Exit if there is something wrong with the command line options.
    // Throwing CliErrorSyntax() also display the help.
    if (args.length < 2) {
      throw new CliErrorSyntax(
        'This application requires at least two arguments.')
    }

    // Implement the functionality.
    // ...

    // To exit for any reason, throw one of the error classes.
    // The exit code is specific to each class.
    if (args[0] !== args[1]) {
      // Alternately, this top function can return the error code, but from
      // deeply nested contexts it is more convenient to throw.
      throw new CliErrorApplication(
        `The arguments '${args[0]}' and '${args[1]}' are not compatible.`)
    }

    log.info('Doing myapp important things...')

    // Enable this to always display the duration, not only in verbose mode.
    // this.outputDoneDuration()

    return CliExitCodes.SUCCESS
  }
}

module.exports.Main = MyApp
