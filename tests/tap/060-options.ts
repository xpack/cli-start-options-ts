/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2023 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/licenses/mit/.
 */

/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */

// ----------------------------------------------------------------------------

/*
 * Test the `Options` class.
 */

// ----------------------------------------------------------------------------

import { strict as assert } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import { test } from 'tap'

// https://www.npmjs.com/package/@xpack/mock-console
import { dumpLines } from '@xpack/mock-console'

// ----------------------------------------------------------------------------

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

assert(cli.Options)
dumpLines([])

// ----------------------------------------------------------------------------

await test('cli.Options constructor & add', async (t) => {
  t.throws(() => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const optionsNone = new cli.Options(undefined as unknown as {
      context: cli.Context
      optionsGroups?: cli.OptionsGroup[]
    })
  }, assert.AssertionError, 'constructor assert(params)')

  t.throws(() => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const optionsNone = new cli.Options({
      context: undefined as unknown as cli.Context
    })
  }, assert.AssertionError, 'constructor assert(params.context)')

  const log = new cli.Logger()
  const context = new cli.Context({ log })

  const optionsEmpty = new cli.Options({ context })

  t.equal(optionsEmpty.groups.length, 0, 'empty groups')
  t.equal(optionsEmpty.commonGroups.length, 0, 'empty commonGroups')

  const options = new cli.Options({
    context,
    optionsGroups: [
      {
        title: 'Group Title',
        optionsDefinitions: [
          {
            options: ['--mmm', '-m'],
            init: () => { },
            action: () => { }
          }
        ]
      },
      {
        isCommon: true,
        title: 'CommonGroup Title',
        optionsDefinitions: [
          {
            options: ['--nnn', '-n'],
            init: () => { },
            action: () => { }
          }
        ]
      }
    ]
  })
  t.equal(options.groups.length, 1, '1 group')
  t.equal(options.commonGroups.length, 1, '1 commonGroups')

  t.equal(options.groups[0]?.title, 'Group Title', 'group title')
  t.equal(options.commonGroups[0]?.title, 'CommonGroup Title',
    'commonGroups title')

  t.equal(options.groups[0]?.optionsDefinitions.length, 1,
    '1 option')
  t.equal(options.commonGroups[0]?.optionsDefinitions.length, 1,
    '1 common option')

  // ----- addGroups() -----

  t.throws(() => {
    options.addGroups(undefined as unknown as cli.OptionsGroup[])
  }, assert.AssertionError, 'addGroups assert(optionsGroups)')

  options.addGroups([
    {
      title: 'Group Title After',
      optionsDefinitions: [
        {
          options: ['--xxx', '-x'],
          init: () => { },
          action: () => { }
        }
      ]
    },
    {
      isCommon: true,
      title: 'CommonGroup Title After',
      optionsDefinitions: [
        {
          options: ['--yyy', '-y'],
          init: () => { },
          action: () => { }
        }
      ]
    }
  ])
  t.equal(options.groups.length, 2, '2 groups')
  t.equal(options.commonGroups.length, 2, '2 commonGroups')

  t.equal(options.groups[1]?.title, 'Group Title After', 'group title after')
  t.equal(options.commonGroups[1]?.title, 'CommonGroup Title After',
    'commonGroups title after')

  options.addGroups([
    {
      isInsertInFront: true,
      title: 'Group Title Before',
      optionsDefinitions: [
        {
          options: ['--aaa', '-a'],
          init: () => { },
          action: () => { }
        }
      ]
    },
    {
      isInsertInFront: true,
      isCommon: true,
      title: 'CommonGroup Title Before',
      optionsDefinitions: [
        {
          options: ['--bbb', '-b'],
          init: () => { },
          action: () => { }
        }
      ]
    }
  ])
  t.equal(options.groups.length, 3, '3 groups')
  t.equal(options.commonGroups.length, 3, '3 commonGroups')

  t.equal(options.groups[0]?.title, 'Group Title Before',
    'group title before')
  t.equal(options.commonGroups[0]?.title, 'CommonGroup Title Before',
    'commonGroups title before')

  // ----- appendToGroups() -----

  t.throws(() => {
    options.appendToGroups(undefined as unknown as cli.OptionsGroup[])
  }, assert.AssertionError, 'appendToGroups assert(optionsGroups)')

  options.appendToGroups([
    {
      title: 'Group Title',
      optionsDefinitions: [
        {
          options: ['--ppp', '-p'],
          init: () => { },
          action: () => { }
        }
      ]
    },
    {
      isCommon: true,
      title: 'CommonGroup Title',
      optionsDefinitions: [
        {
          options: ['--qqq', '-q'],
          init: () => { },
          action: () => { }
        }
      ]
    }
  ])

  t.equal(options.groups.length, 3, '3 groups')
  t.equal(options.commonGroups.length, 3, '3 commonGroups')

  t.equal(options.groups[1]?.title, 'Group Title', 'group title')
  t.equal(options.commonGroups[1]?.title, 'CommonGroup Title',
    'commonGroups title')

  t.equal(options.groups[1]?.optionsDefinitions.length, 2,
    '2 options')
  t.equal(options.commonGroups[1]?.optionsDefinitions.length, 2,
    '2 common option')

  t.equal(options.groups[1]?.optionsDefinitions[1]?.options[0], '--ppp',
    'option --ppp')
  t.equal(options.commonGroups[1]?.optionsDefinitions[1]?.options[0], '--qqq',
    'option --qqq')

  options.appendToGroups([
    {
      isInsertInFront: true,
      title: 'Group Title',
      optionsDefinitions: [
        {
          options: ['--ccc', '-c'],
          init: () => { },
          action: () => { }
        }
      ]
    },
    {
      isInsertInFront: true,
      isCommon: true,
      title: 'CommonGroup Title',
      optionsDefinitions: [
        {
          options: ['--ddd', '-d'],
          init: () => { },
          action: () => { }
        }
      ]
    }
  ])

  t.equal(options.groups.length, 3, '3 groups')
  t.equal(options.commonGroups.length, 3, '3 commonGroups')

  t.equal(options.groups[1]?.title, 'Group Title', 'group title')
  t.equal(options.commonGroups[1]?.title, 'CommonGroup Title',
    'commonGroups title')

  t.equal(options.groups[1]?.optionsDefinitions.length, 3,
    '3 options')
  t.equal(options.commonGroups[1]?.optionsDefinitions.length, 3,
    '3 common option')

  t.equal(options.groups[1]?.optionsDefinitions[0]?.options[0], '--ccc',
    'option --ccc')
  t.equal(options.commonGroups[1]?.optionsDefinitions[0]?.options[0], '--ddd',
    'option --ddd')

  t.end()
})

interface XaConfig extends cli.Configuration {
  mmmInit: boolean
  nnnInit: boolean
}

await test('cli.Options initializeConfiguration', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })

  const optionsEmpty = new cli.Options({ context })

  t.equal(optionsEmpty.groups.length, 0, 'empty groups')
  t.equal(optionsEmpty.commonGroups.length, 0, 'empty commonGroups')

  const options = new cli.Options({
    context
  })

  // Check missing mandatory.
  options.addGroups([
    {
      title: 'Group Title',
      optionsDefinitions: [
        {
          options: ['--mmm', '-m'],
          init: (context) => { (context.config as XaConfig).mmmInit = true },
          action: () => { },
          isOptional: true
        }
      ]
    },
    {
      isCommon: true,
      title: 'CommonGroup Title',
      optionsDefinitions: [
        {
          options: ['--nnn', '-n'],
          init: (context) => { (context.config as XaConfig).nnnInit = true },
          action: () => { },
          isOptional: true
        }
      ]
    }
  ])

  const { remainingArgv, missingMandatoryErrors } =
    options.parse([])

  t.equal(remainingArgv.length, 0, '0 remaining')
  t.equal(missingMandatoryErrors.length, 0, 'no errors')

  t.ok((context.config as XaConfig).mmmInit, 'mmmInit')
  t.ok((context.config as XaConfig).nnnInit, 'nnnInit')

  t.end()
})

await test('cli.Options parse', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })

  // Check missing mandatory.
  const options = new cli.Options({
    context
  })

  t.throws(() => {
    options.parse(undefined as unknown as string[])
  }, assert.AssertionError, 'parse assert(argv)')

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['abc', '--', '--ooo', 'xyz'])

    t.equal(remainingArgv.length, 4, '4 remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')
  }

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse([
        undefined as unknown as string,
        '--',
        undefined as unknown as string
      ])

    t.equal(remainingArgv.length, 3, '3 remaining')
    t.equal(remainingArgv[0], '', 'first is empty')
    t.equal(remainingArgv[2], '', 'third is empty')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')
  }

  t.end()
})

await test('cli.Options parse missing mandatory', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })

  // Check missing mandatory.
  const options = new cli.Options({
    context
  })

  // Check missing mandatory.
  options.addGroups([
    {
      title: 'Group Title',
      optionsDefinitions: [
        {
          options: ['--aaa', '-a'],
          init: () => { },
          action: () => { },
          isOptional: true
        },
        {
          options: ['--ccc', '-c'],
          init: () => { },
          action: () => { }
        },
        {
          options: ['--mmm', '-m'],
          init: () => { },
          action: () => { }
        }
      ]
    },
    {
      isCommon: true,
      title: 'CommonGroup Title',
      optionsDefinitions: [
        {
          options: ['--bbb', '-b'],
          init: () => { },
          action: () => { },
          isOptional: true
        },
        {
          options: ['--ddd', '-d'],
          init: () => { },
          action: () => { }
        },
        {
          options: ['--nnn', '-n'],
          init: () => { },
          action: () => { }
        }
      ]
    }
  ])

  const { remainingArgv, missingMandatoryErrors } =
    options.parse(['--ccc', '--ddd'])
  t.equal(remainingArgv.length, 0, 'empty remaining')
  t.equal(missingMandatoryErrors.length, 2, '2 errors')
  // dumpLines(missingMandatoryErrors)
  t.equal(missingMandatoryErrors[0], 'Mandatory \'--mmm|-m\' not found',
    'mandatory --mmm')
  t.equal(missingMandatoryErrors[1], 'Mandatory \'--nnn|-n\' not found',
    'mandatory --nnn')

  t.end()
})

interface XbConfig extends cli.Configuration {
  one: boolean
  two: string | undefined
  three: string | undefined
}

await test('cli.Options processOption', async (t) => {
  const log = new cli.Logger()
  const context = new cli.Context({ log })

  const options = new cli.Options({
    context
  })

  // Check missing mandatory.
  options.addGroups([
    {
      title: 'Group Title',
      optionsDefinitions: [
        {
          options: ['--one', '-o'],
          init: (context) => { (context.config as XbConfig).one = false },
          action: (context) => { (context.config as XbConfig).one = true },
          isOptional: true
        },
        {
          options: ['--two'],
          init: (context) => {
            (context.config as XbConfig).two = undefined
          },
          action: (context, value) => {
            (context.config as XbConfig).two = value
          },
          hasValue: true,
          isOptional: true
        },
        {
          options: ['--three'],
          init: (context) => {
            (context.config as XbConfig).three = undefined
          },
          action: (context, value) => {
            (context.config as XbConfig).three = value
          },
          hasValue: true,
          values: ['yes', 'no'],
          isOptional: true
        }
      ]
    }
  ])

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['--one'])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.ok((context.config as XbConfig).one, '--one true')
  }

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['-o'])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.ok((context.config as XbConfig).one, '-o true')
  }

  // Options with values.
  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['--two=123'])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.equal((context.config as XbConfig).two, '123', '--two=123')
  }

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['--two='])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.equal((context.config as XbConfig).two, '', '--two=')
  }

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['--two=a=b=c'])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.equal((context.config as XbConfig).two, 'a=b=c', '--two=a=b=c')
  }

  try {
    options.parse(['--two'])
    t.notOk(true, 'should throw')
  } catch (err: any) {
    t.ok(err instanceof cli.SyntaxError, 'SyntaxError')
    t.match(err.message, 'expects a value', 'SyntaxError expects a value')
  }

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['--two', '123'])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.equal((context.config as XbConfig).two, '123', '--two 123')
  }

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['--two', undefined as unknown as string])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.equal((context.config as XbConfig).two, '', '--two \'\'')
  }

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['--two', '-o'])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.equal((context.config as XbConfig).two, '-o', '--two -o')
    t.notOk((context.config as XbConfig).one, '--one false')
  }

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['--two', '-o', '-o'])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.equal((context.config as XbConfig).two, '-o', '--two -o')
    t.ok((context.config as XbConfig).one, '--one true')
  }

  {
    const { remainingArgv, missingMandatoryErrors } =
      options.parse(['--three=yes'])
    t.equal(remainingArgv.length, 0, 'empty remaining')
    t.equal(missingMandatoryErrors.length, 0, 'no errors')

    t.equal((context.config as XbConfig).three, 'yes', '--three=yes')
  }

  try {
    options.parse(['--three=niet'])
    t.notOk(true, 'should throw')
  } catch (err: any) {
    t.ok(err instanceof cli.SyntaxError, 'SyntaxError')
    t.match(err.message, 'not allowed for', 'SyntaxError not allowed for')
  }

  t.end()
})

// ----------------------------------------------------------------------------