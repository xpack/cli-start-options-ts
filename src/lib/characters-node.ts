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

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

/**
 * @classdesc
 * Internal class used to construct the tree of commands.
 *
 * The tree includes nodes for each character in the commands.
 * Leaves are always a space character.
 */
export class Node {
  // --------------------------------------------------------------------------

  // Lowercase single letter;
  // The root node has a null character, as a terminator for searches.
  public character: string | null
  // Count how many paths this character is part of.
  // (to detect non-uniquely identified paths)
  public count: number = 0
  // Path to file implementing the command.
  // Nodes with multiple counts have the path removed, since
  // they cannot be uniquely identified.
  public relativeFilePath: string | undefined
  // The full length command (the first in the list)
  public unaliasedCommand: string | undefined
  public children: Node[] = []

  /**
   * @summary Add a character to the commands tree.
   *
   * @param parent The node to add the character as a child.
   * @param character One char string.
   * @param relativeFilePath Relative path to the file
   *   implementing the command.
   * @param unaliasedCommand Official command name (unaliased).
   * @returns The new node added to the tree.
   */
  static add (
    parent: Node,
    character: string | null,
    relativeFilePath: string,
    unaliasedCommand: string
  ): Node {
    assert(parent !== null, 'Null parent.')

    for (const child of parent.children) {
      if (child.character === character) {
        child.count += 1
        // If not unique, the file is unusable.
        child.relativeFilePath = undefined
        return child
      }
    }

    const node = new Node(character, relativeFilePath, unaliasedCommand)
    parent.children.push(node)
    return node
  }

  /**
   * @summary Create a tree node to store the character and the children nodes.
   *
   * @param character One char string.
   * @param relativeFilePath Relative path to the file
   *   implementing the command.
   * @param unaliasedCommand Official command name (unaliased).
   * @returns The newly created node.
   */
  constructor (
    character: string | null,
    relativeFilePath?: string,
    unaliasedCommand?: string
  ) {
    this.character = character != null ? character.toLowerCase() : null
    this.count = 1
    this.relativeFilePath = relativeFilePath
    this.unaliasedCommand = unaliasedCommand
    this.children = []
  }
}

// ----------------------------------------------------------------------------
