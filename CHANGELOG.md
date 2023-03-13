# Change log

Changes in reverse chronological order.

Refer to GitHub [issues](https://github.com/xpack/cli-start-options-js/issues).

## 2023-03-13

* 73100af README update
* 71484dc package-lock.json update
* 6a5e8c1 .npmignore update
* 302319e .gitignore cosmetics
* 0b264fd eslint-disable-next-line import/export
* 5091103 cli-applications.ts: reorder imports
* 4933ffa package-lock.json updates
* fc46e0b package.json: url cosmetics
* 8df2a78 package.json: esm
* 9c5d34e package.json: node 16
* 2c73f08 nodejs.yml: update action version
* d89a7d9 move destination to esm
* 133418b cosmetise copyright notices
* f3544dd cli-application.ts: default >=16.0.0
* af18b1f cli-application.ts: mtime.valueOf()

## 2023-02-28

* 7c399f9 check engines.node from package.json
* 7cfa4af package-lock.json
* 67da454 consistent run() & prepareAndRun()
* f3c896d launch.json update
* 5f52b4d src/*.ts: remove typedoc types
* f6d656c tests/040-* disable two tests
* a008481 tests/030-* disable two tests
* d0b0f00 tests updates for new cli-application
* b8090e2 cli-command.ts: rename outputHelpArgsDetails
* bcd0313 cli-application.ts: implement outputHelp() here
* 2d1cf2e cli-command.ts: rename outputHelp()
* d055878 cli-application.ts: rework without static members
* 2dd00b9 cli-help.ts: update for packageJson
* 9d42526 cli-options.ts: clear at initialise()
* 4abea75 cli-command.ts: update for new config & context
* 5ed2013 make CliContext a class
* d1ec1d4 add cli-configuration.ts

## 2023-02-25

* 6beb286 .vscode/settings.json: ignoreWords
* fd14a91 .vscode/launch.json updates
* 6d2f9ad cli-application.ts: assert message
* 591ad2b cli-application.ts: invokedFromCli = false
* 4e7c71e cli-applications.ts: rework log level init
* 258364c add initialiseContextParameters
* 4bc5ee9 catch (err: any)
* aa4b2db mock/xtest/src/main.ts comments
* c2e835a mock/common.ts: exports
* f1a1264 cleanups
* 467ce2d tests/mock/bin: migrate to .ts
* 4298730 remove eslint valid-jsdoc
* e48a959 bring back REPL functionality

## 2023-02-24

* bf0663d src: replace cli-logger.ts with @xpack/logger
* 144ce2d package.json: add @xpack/logger to deps

## 2023-02-23

* 34e5076 cli-*: replace .concat() with .push(...)
* 7b52f11 .vscode/settings.json: ignoreWords
* 4d0dc0e tests: refer to dist, to avoid re-compiling src
* fee86db tsconfig.json: remove reference & composite
* 79afdae tests/tsconfig.json: compile only mock, no tap
* 301fce2 package.json: compile src & tests
* b53fbd9 nodejs.yml: revert to ci
* 16a1610 package-lock.json: version 1
* edce6dc cli-context: add dummy
* 221fbdc nodejs.yml: try nom install
* 91f7e94 nodejs.yml: update paths-ignore
* f3020f6 typedoc.json update
* 65c8732 .vscode/launch.json: update for .mjs
* de251e3 tests: update for ts
* b81f091 .npmignore update
* 29efd62 .gitignore update
* db0e251 package.json: update ts-standard
* 88b352b package.json: update tap
* cb5d6e6 package.json: update scripts
* 7684f45 package.json: add devDeps
* b4bf1f9 tsconfig.json updates
* 976c1e9 index.ts: import cli-context.js
* bc3fb0c ts-standard fixes
* ae8c16f cli-application.ts: inline __dirname
* 6a5bd4e src: // eslint-disable-next-line

## 2023-02-21

* 66def3e tests/* reformat
* ac0bcbc src/*: fix undefined errors
* 8344ba4 package.json: add tap config
* c4e2357 add typedoc deps & config
* 16cd7b5 .*ignore updates
* 6850fc2 package.json: update scripts
* 4a97cd5 package.json: module definitions
* 5ba747f rework multiple tsconfig.json

## 2023-02-17

* 2211d1c rework author tests
* 4ba439b cli-application.ts & tests: return exitCode
* def9397 tests: fix typo
* b6a617f cli-help.ts: use multiPass.updateWidth()
* 17251c6 package.json: add c8 for coverage
* fa16c64 myapp.js example: fix typo
* 0c4458d package.json: @xpack/... 0.10.0-pre
* cb9b259 tsconfig.json update
* 55fe5ef .vscode/settings.json: ignoreWords
* 34cb44c .vscode/launch.json update
* 83a520f typescript: second take

## 2023-02-16

* 61139d4 remove REPL functionality
* cc1153e typescript: first take

## 2023-02-15

* 997c503 package.json: reorder scripts
* 8530a6e shorten copyright notice

## 2023-02-12

* 3b35100 package-lock.json update
* 292cedb add nodejs.yml, remove travis & appveyor
* 36c8feb 050-interactive.js: rename outStr
* 6f54e75 fix typos in comments
* bb6721f .vscode/settings.json: ignoreWords
* e1d4143 TS updates as node16
* ceda7f2 package.json: update scripts
* 6fb48d4 package.json: bump deps
* 4e2960e tests: rename to plural & update for ES module

## 2023-02-10

* 30b871d rename .jt to .ts

## 2023-02-09

* 4e560a4 0.8.1
* 238bdf3 prepare 0.8.1
* 64b9f45 cli-options.js: explicit file:// for import

## 2023-02-08

* v0.8.0 released
* 5c30456 .vscode/settings.json: ignoreWords
* bd5c3e6 package.json: engines >=14.13.1
* 267911b package.json: bump deps
* 2fabbae #22: use dynamic include instead of require()

## 2022-05-03

* v0.6.6 released
* 98e606c #21: fix the missing apostrophe before the space

## 2022-04-30

* v0.6.5 released
* c99023f package.json: lock standard to 16.0.3
* 019b69f #21: fix missing space

## 2022-04-14

* v0.6.4 released
* a8861a2 #20 refer to version in update recommendation

## 2021-08-09

* release v0.6.3
* [#19] - fix the missing --global on windows

## 2021-07-21

* release v0.6.2
* [#18] - process errors while retrieving latest version
* [#17] - deprecate reference to package user-home

## 2021-03-26

* release v0.6.1
* update for the new version of standard.js
* bump dependencies

## 2018-12-25

* release v0.6.0
* [#10] Show stack for all system errors
* [#9] Add new error classes (type, input, output)
* bump dependencies to fix vulnerabilities

## 2018-12-23

* release v0.5.1
* [#8] cli-application.js, show assert stack

## 2018-11-02

* release v0.5.0
* [#7] Add more functions to check the log level

## 2018-09-18

* release v0.4.13
* [#6] Process Error, SyntaxError, TypeError gently

## 2018-07-31

* release v0.4.12
* rename exception in catch() as `ex`

## 2018-04-30

* release v0.4.11
* [#5] check if the install path is below /usr/local

## 2018-04-24

* release v0.4.10
* cli-error: add ERROR.PREREQUISITES
* deps: add semver@5.5.0
* [#4] Check node version >= 8.x

## 2018-04-17

* release v0.4.9
* fix typo in trace message

## 2018-04-13

* release v0.4.8
* split update message on two lines.
* release v0.4.6
* add force to delete

## 2018-04-07

* release v0.4.5
* improve logic to save the timestamp
* release v0.4.4
* add 'sudo' to message, if installed globally
* release v0.4.3
* cli-application: check for updates

## 2017-11-12)

* release v0.4.2
* cli-options: fix cmds split

## 2017-10-10

* release v0.4.1
* README: add How to publish
* cli-commands: in outputDoneDuration () also display the actual command after the program name

## 2017-09-19

* release v0.4.0
* cli-commands: add formatDuration()

## 2017-09-18

* release v0.3.1
* add 'npm run link'
* add support for single command
* add chdir() to -C path
* update tsts for tar 4.x
* update tests for node 8.5 AssertionError with cause

## 2017-05-15

* release v0.2.2
* CliCommand: add unparsedArgs property
* CliCommand.addGenerator() uses unparsedArgs

## 2017-04-29

* release v0.2.1
* CliError: add ERROR.CHILD
* CliOptions: add filterOtherArguments()
* release v0.2.0
* still not perfect, but more ready for prime time
* logger default level is 'info'
* logger without prefixes for normal output; warnings/errors/debug with prefixes
* -s (silent), -q (quiet), -v (verbose), -d (debug), -dd (trace) intuitive options

## 2017-04-07

* release v0.1.1-19
* development versions, mostly experimental.
