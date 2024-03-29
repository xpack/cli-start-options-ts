#!/usr/bin/env node
// Mandatory shebang must point to `node` and this file must be executable.

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

/*
 * On POSIX platforms, when installing a global package, a symbolic
 * link with the name given in the bin section of package.json is
 * created in the `/usr/local/bin` folder (on macOS), or
 * in the `/usr/bin` folder (on Ubuntu), pointing to this file.
 *
 * On Windows, where symbolic links to files are not available,
 * when installing a global package,
 * two forwarders are automatically created in the
 * user `\AppData\Roaming\npm\node_modules\<name>\bin` folder:
 * - `<name>.cmd`, for invocations from the Windows command line
 * - `<name>` (a shell script), for invokations from an optional
 * POSIX environment like minGW-w64, msys2, git shell, etc.
 *
 * On all platforms, `process.argv[1]` will be the full path of
 * this file, or the full path of the `<name>` link, so, in case
 * the program will need to be invoked with different names, create
 * multiple files like this and enumerate them in the bin section
 * of the package.json.
 */

// ----------------------------------------------------------------------------

// ES6: `import { Main } from 'main.js'
const { Main } = require('../index.js')

// ----------------------------------------------------------------------------

Main.start().then((code) => { process.exitCode = code })

// ----------------------------------------------------------------------------
