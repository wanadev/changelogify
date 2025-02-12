# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.2.2] - 2025-2-12

- add a new changelog type for tests
- update simple-git for security issue
- fix duplicated line in changelog when no issue number

## [v1.2.1]

- fix fs use of URL on Windows

## [v1.2.0]

- better handling of branch number beginning by 0 or by letters
- clarify how to link an issue from a branch number
- cleanup: 
  - divide into several files
  - make changelogify an ESM
  - lint
- check for missing config before `add` and `release` commands 

## [v1.1.7]

- add default command option in config 

## [v1.1.6]

- fix error on release auto commit when `unrealeased` directory is missing

## [v1.1.5]

- do not throw error at release when `unrealeased` directory is missing

## [v1.1.3]

- process exits with non-zero code if an error occurs

## [v1.1.2]

- synchronous writing in changelog file at release

## [v1.1.1]

- fix urls in package.json for npm package

## [v1.1.0]

- throw error when JSON changelog files have wrong format
- remove changelog messages trailing spaces
- display helper when wrong cli argument submitted

## [v1.0.1]

- add license

## [v1.0.0]

- initial release
