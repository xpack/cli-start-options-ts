#!/usr/bin/env node
// Mandatory shebang must point to `node` and this file must be executable.

/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2019 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/MIT/.
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
