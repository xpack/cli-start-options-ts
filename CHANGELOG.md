# Change log

Changes in reverse chronological order.

Refer to GitHub [issues](https://github.com/xpack/cli-start-options-js/issues/).

## 2023-05-18

* v0.8.5.2 released
* 2789333 #29: fix mkdir('/') on windows (legacy-js)

## 2023-02-12

* 7dd7721 cli-options.js: default un-aliased
* adfde85 cli-application.js: fix date delta
* a0728c4 cli-application.js: fix process.exit for engine

## 2023-02-09

* v0.8.1 released
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

## 2018-04-13

* release v0.4.6
* add force to delete

## 2018-04-07

* release v0.4.5
* improve logic to save the timestamp

## 2018-04-07

* release v0.4.4
* add 'sudo' to message, if installed globally

## 2018-04-07

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
