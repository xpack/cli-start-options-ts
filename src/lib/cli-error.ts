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

/* eslint valid-jsdoc: "error" */
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * CLI exit codes and errors used to throw exceptions.
 */

// ----------------------------------------------------------------------------
// Exit codes:

const ERROR = {
  NONE: 0, // OK
  SYNTAX: 1,
  APPLICATION: 2, // Any functional error.
  INPUT: 3, // No file, no folder, wrong format, etc.
  OUTPUT: 4, // Cannot create file, cannot write, etc.
  CHILD: 5, // Child return error.
  PREREQUISITES: 6, // Prerequisites not met.
  // Mismatched type, usually in configurations error; unimplemented, unsupported
  TYPE: 7
}

export const CliExitCodes = {
  ERROR,
  SUCCESS: ERROR.NONE
}

// ============================================================================

/**
 * @classdesc
 * Base class for all CLI triggered errors.
 */
export class CliError extends Error {
  // --------------------------------------------------------------------------

  public exitCode

  /**
   * @summary Create a new syntax error instance.
   *
   * @param {string} message Error description.
   * @param {number} exitCode Integer value to be returned.
   *
   * @description
   * Remember the exit code.
   */
  constructor (message, exitCode = undefined) {
    super(message)

    this.exitCode = exitCode
  }
}

/**
 * @classdesc
 * CLI triggered syntax error.
 * Will try to be helpful (using help())
 */
export class CliErrorSyntax extends CliError {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new syntax error instance.
   *
   * @param {string} message Error description.
   *
   * @description
   * Create a CliError instance with the ERROR.SYNTAX error code.
   */
  constructor (message) {
    super(message, ERROR.SYNTAX)
  }
}

/**
 * @classdesc
 * CLI triggered application error.
 *
 * @deprecated
 * Use CliError without any error code.
 */
export class CliErrorApplication extends CliError {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new application error instance.
   *
   * @param {string} message Error description.
   *
   * @description
   * Create a CliError instance with the ERROR.APPLICATION error code.
   */
  constructor (message) {
    super(message, ERROR.APPLICATION)
  }
}

/**
 * @classdesc
 * CLI triggered type error.
 */
export class CliErrorType extends CliError {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new type error instance.
   *
   * @param {string} message Error description.
   *
   * @description
   * Create a CliError instance with the ERROR.TYPE error code.
   */
  constructor (message) {
    super(message, ERROR.TYPE)
  }
}

/**
 * @classdesc
 * CLI triggered input error.
 */
export class CliErrorInput extends CliError {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new input error instance.
   *
   * @param {string} message Error description.
   *
   * @description
   * Create a CliError instance with the ERROR.INPUT error code.
   */
  constructor (message) {
    super(message, ERROR.INPUT)
  }
}

export class CliErrorOutput extends CliError {
  // --------------------------------------------------------------------------

  /**
   * @summary Create a new output error instance.
   *
   * @param {string} message Error description.
   *
   * @description
   * Create a CliError instance with the ERROR.OUTPUT error code.
   */
  constructor (message) {
    super(message, ERROR.OUTPUT)
  }
}

// ----------------------------------------------------------------------------
