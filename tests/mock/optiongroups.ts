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

import * as cli from '../../esm/index.js'

// ----------------------------------------------------------------------------

export const lotsOfOptions: cli.OptionsGroup[] = [
  {
    description: 'Common group',
    isCommon: true,
    optionsDefinitions: [
      {
        options: ['--opt-common'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
          description: 'Opt common'
        }
      },
      {
        options: ['-e', '--opt-early'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
          description: 'Opt early',
          isRequiredEarly: true
        }
      },
      {
        options: ['-h', '--opt-help'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
          description: 'Opt help',
          isHelp: true
        }
      }]
  },
  {
    description: 'Group options',
    optionsDefinitions: [
      {
        options: ['-o', '--out'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        helpDefinitions: {
          description: 'Opt file',
          valueDescription: 'file'
        }
      },
      {
        options: ['--opt'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
          description: 'Opt'
        }
      },
      {
        options: ['--opt-str'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        helpDefinitions: {
          description: 'Opt string'
        }
      },
      {
        options: ['--opt-str-multiple'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        helpDefinitions: {
          description: 'Opt string multiple',
          isMultiple: true
        }
      },
      {
        options: ['--opt-multiple'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
          description: 'Opt string multiple',
          isMultiple: true
        }
      },
      {
        options: ['--opt-str-default'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        helpDefinitions: {
          description: 'Opt string with default',
          defaultValueDescription: 'ddd'
        }
      },
      {
        options: ['--opt-str-default-multi'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        helpDefinitions: {
          description: 'Opt string with default multi',
          defaultValueDescription: 'ddd',
          isMultiple: true
        }
      },

      {
        options: ['--opt-str-mandatory'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        isMandatory: true,
        helpDefinitions: {
          description: 'Opt string mandatory'
        }
      },
      {
        options: ['--opt-str-multiple-mandatory'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        isMandatory: true,
        helpDefinitions: {
          description: 'Opt string multiple mandatory',
          isMultiple: true
        }
      },
      {
        options: ['--opt-str-default-mandatory'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        isMandatory: true,
        helpDefinitions: {
          description: 'Opt string with default mandatory',
          defaultValueDescription: 'ddd'
        }
      },
      {
        options: ['--opt-str-default-multi-mandatory'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        isMandatory: true,
        helpDefinitions: {
          description: 'Opt string with default multi mandatory',
          defaultValueDescription: 'ddd',
          isMultiple: true
        }
      },

      {
        options: ['--opt-values'],
        init: (_context) => { },
        action: (_context, _val) => { },
        values: ['one', 'two'],
        helpDefinitions: {
          description: 'Opt values'
        }
      },
      {
        options: ['--opt-values-multi'],
        init: (_context) => { },
        action: (_context, _val) => { },
        values: ['one', 'two'],
        helpDefinitions: {
          description: 'Opt values multiple',
          isMultiple: true
        }
      },
      {
        options: ['--opt-values-default'],
        init: (_context) => { },
        action: (_context, _val) => { },
        values: ['one', 'two'],
        helpDefinitions: {
          description: 'Opt values with default',
          defaultValueDescription: 'one'
        }
      },
      {
        options: ['--opt-values-default-multi'],
        init: (_context) => { },
        action: (_context, _val) => { },
        values: ['one', 'two'],
        helpDefinitions: {
          description: 'Opt values with default multi',
          defaultValueDescription: 'one',
          isMultiple: true
        }
      },

      {
        options: ['--opt-values-mandatory'],
        init: (_context) => { },
        action: (_context, _val) => { },
        values: ['one', 'two'],
        isMandatory: true,
        helpDefinitions: {
          description: 'Opt values mandatory'
        }
      },
      {
        options: ['--opt-values-multi-mandatory'],
        init: (_context) => { },
        action: (_context, _val) => { },
        values: ['one', 'two'],
        isMandatory: true,
        helpDefinitions: {
          description: 'Opt values multiple mandatory',
          isMultiple: true
        }
      },
      {
        options: ['--opt-values-default-mandatory'],
        init: (_context) => { },
        action: (_context, _val) => { },
        values: ['one', 'two'],
        isMandatory: true,
        helpDefinitions: {
          description: 'Opt values with default mandatory',
          defaultValueDescription: 'one'
        }
      },
      {
        options: ['--opt-values-default-multi-mandatory'],
        init: (_context) => { },
        action: (_context, _val) => { },
        values: ['one', 'two'],
        isMandatory: true,
        helpDefinitions: {
          description: 'Opt values with default multi mandatory',
          defaultValueDescription: 'one',
          isMultiple: true
        }
      },
      {
        options: ['--opt-str-very-very-very-very-very-long'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        helpDefinitions: {
          description: 'Opt string long'
        }
      },
      {
        options: ['-E', '--opt-early-cmd'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
          description: 'Opt early command',
          isRequiredEarly: true
        }
      },
      {
        options: ['-x', '--opt-early-cmd-nodesc'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
          isRequiredEarly: true
        }
      },
      {
        options: ['-H', '--opt-help-cmd'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
          description: 'Opt help command',
          isHelp: true
        }
      },

      {
        // Not shown.
        options: ['--opt-no-desc'],
        init: (_context) => { },
        action: (_context, _val) => { },
        hasValue: true,
        helpDefinitions: {
        }
      }
    ]
  },
  {
    description: 'Options without description',
    optionsDefinitions: [
      {
        options: ['--no-description'],
        init: (_context) => { },
        action: (_context, _val) => { },
        helpDefinitions: {
        }
      }
    ]
  },
  {
    description: 'Options without help',
    optionsDefinitions: [
      {
        options: ['--no-help'],
        init: (_context) => { },
        action: (_context, _val) => { }
      }
    ]
  }
]

// ----------------------------------------------------------------------------
