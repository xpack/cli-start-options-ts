/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2017 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/license/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * CLI exit codes and errors used to throw exceptions.
 */

// ----------------------------------------------------------------------------
// Exit codes:

export const ERROR = {
  NONE: 0, // OK
  SYNTAX: 1,
  APPLICATION: 2, // Any functional error.
  INPUT: 3, // No file, no folder, wrong format, etc.
  OUTPUT: 4, // Cannot create file, cannot write, etc.
  CHILD: 5, // Child return error.
  PREREQUISITES: 6, // Prerequisites not met.
  // Mismatched type, usually in configurations error; unimplemented,
  // unsupported
  TYPE: 7
}

export const ExitCodes = {
  ERROR,
  SUCCESS: ERROR.NONE
}

// ============================================================================

// The local names are prefixed, to avoid confusion with system definitions.
// The exported definitions are expected to be used as `cli.Error`, so no
// confusions.

/**
 * @summary Base class for all CLI triggered errors.
 */
class _Error extends Error {
  // --------------------------------------------------------------------------

  public exitCode: number

  /**
   * @summary Create a new syntax error instance.
   *
   * @param message Error description.
   * @param exitCode Integer value to be returned.
   *
   * @description
   * Remember the exit code.
   */
  constructor (message: string, exitCode: number = ERROR.APPLICATION) {
    super(message)

    this.exitCode = exitCode
  }
}

export { _Error as Error }

/**
 * @summary CLI triggered syntax error.
 *
 * @description
 * Will try to be helpful (using help())
 */
class _SyntaxError extends _Error {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new syntax error instance.
   *
   * @param message Error description.
   *
   * @description
   * Create a cli.Error instance with the ERROR.SYNTAX error code.
   */
  constructor (message: string) {
    super(message, ERROR.SYNTAX)
  }
}

export { _SyntaxError as SyntaxError }

/**
 * @summary CLI triggered application error.
 *
 * @deprecated
 * Use cli.Error without any error code.
 */
class _ApplicationError extends _Error {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new application error instance.
   *
   * @param message Error description.
   *
   * @description
   * Create a cli.Error instance with the ERROR.APPLICATION error code.
   */
  constructor (message: string) {
    super(message, ERROR.APPLICATION)
  }
}

export { _ApplicationError as ApplicationError }

/**
 * @summary CLI triggered type error.
 */
class _TypeError extends _Error {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new type error instance.
   *
   * @param message Error description.
   *
   * @description
   * Create a cli.Error instance with the ERROR.TYPE error code.
   */
  constructor (message: string) {
    super(message, ERROR.TYPE)
  }
}

export { _TypeError as TypeError }

/**
 * @summary CLI triggered input error.
 */
export class _InputError extends _Error {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new input error instance.
   *
   * @param message Error description.
   *
   * @description
   * Create a cli.Error instance with the ERROR.INPUT error code.
   */
  constructor (message: string) {
    super(message, ERROR.INPUT)
  }
}

export { _InputError as InputError }

class _OutputError extends _Error {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new output error instance.
   *
   * @param message Error description.
   *
   * @description
   * Create a cli.Error instance with the ERROR.OUTPUT error code.
   */
  constructor (message: string) {
    super(message, ERROR.OUTPUT)
  }
}

export { _OutputError as OutputError }

// ----------------------------------------------------------------------------
