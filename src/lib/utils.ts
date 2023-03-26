/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2018 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/license/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'

// ----------------------------------------------------------------------------

export interface NpmPackageJson {
  name: string
  version: string
  description?: string
  homepage?: string
  bugs?: {
    url?: string
  }
  author?: string | {
    name?: string
    email?: string
    url?: string
  }
  engines?: {
    node?: string
  }
}

// ----------------------------------------------------------------------------

/**
 * @summary Get the program name.
 *
 * @returns A string with the name used to invoke the program.
 *
 * @description
 * To differentiate between multiple invocations with different
 * names, extract the name from the last path element; ignore
 * extensions, if any.
 */

export function getProcessProgramName (): string {
  const argv1 = process.argv[1]?.trim()
  assert(argv1 !== undefined, 'Mandatory argv[1]')

  const fileName: string = path.basename(argv1)
  let programName
  if (fileName.indexOf('.') !== undefined) {
    programName = fileName.split('.')[0]?.trim()
  } else {
    programName = fileName?.trim()
  }
  assert(programName !== undefined && programName.length > 0,
    'Mandatory program name')

  return programName
}

/**
 * @summary Read package JSON file.
 *
 * @param folderAbsolutePath The absolute path of the package.
 * @returns The package definition, unmodified.
 * @throws Error from `fs.readFile()` or `JSON.parse()`.
 *
 * @description
 * Read the `package.json` file from the given path and
 * parse it with the standard JSON parser (which does not
 * accept comments!).
 */
export async function readPackageJson (folderAbsolutePath: string):
Promise<NpmPackageJson> {
  assert(folderAbsolutePath)

  const filePath = path.join(folderAbsolutePath, 'package.json')
  const fileContent = await fs.promises.readFile(filePath)
  assert(fileContent !== null)
  return JSON.parse(fileContent.toString())
}

/**
 * @summary Convert a duration in ms to seconds if larger than 1000.
 * @param millis Duration in milliseconds.
 * @returns Value in ms or sec.
 */
export function formatDuration (millis: number): string {
  if (millis < 1000) {
    return `${millis} ms`
  }
  return `${(millis / 1000).toFixed(3)} sec`
}

// ----------------------------------------------------------------------------
