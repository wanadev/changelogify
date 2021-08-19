# Changelogify

A basic changelog manager made to avoid conflicts at git merge.

## Install

Add the package to your project as a dev dependency:

    npm install -D changelogify

## Usage

    changelogify [options]

    Options:
        init          Copy default configuration file into package to be overwriten.
                            If the user configuration file is not found, default one will be used.
        add           Write/overwrite the current git branch changelog file 
                            into ./changelogs/unreleased/
        release       Concat changelogs file from ./changelogs/unreleased/,
                            add them into ./CHANGELOG.md and delete them.

If no option is specified, `add` is used. This can be changed or removed to display the helper above, see `defaultCommand` in configuration file.

## Example

These three changelogs

```json
{
  "message": "feature 1",
  "type": "Added",
  "branch": "7"
}
```

```json
{
  "message": "feature 2",
  "type": "Added"
}
```

```json
{
  "message": "lint",
  "type": "Meta",
  "branch": "8"
}
```

will be concatenated into `CHANGELOG.md`

    # Changelog

    All notable changes to this project will be documented in this file.

    The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
    and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

    ## [v1.0.0] - 2020-1-29

    ### Added
    - feature 1 - [7](www.example.com/issues/7)
    - feature 2
    ### Meta
    - lint - [8](www.example.com/issues/8)

## Commands

### Init

With `init`, the default configuration is copied in `./changelogs/config.json`, where you can overwrite it.

```js
{
    // changelog types
    "types": [
        "Added",
        "Changed",
        "Deprecated",
        "Removed",
        "Fixed",
        "Security",
        "Meta"
    ],
    // link to git issue. `NUMBER` is current branch number by default
    // if empty, no link will be provided
    "gitIssueTemplate": "[NUMBER](www.example.com/issues/NUMBER)",
    // automatic commit for `add` command
    "autoCommitAdd": true,
    // associated commit message. `NUMBER` is current branch number by default
    "changelogMessageAdd": "Add changelog entry for #NUMBER",
    // automatic commit for `release` command
    "autoCommitRelease": true,
    // associated commit message.
    "changelogMessageRelease": "changelog",
    // default command if none is passed ("", "add", "init" or "release")
    "defaultCommand": "add"
}
```

After updating the library, you should execute `init`. New settings will be appended, keeping the old ones.

It also creates the file `./EMPTY_CHANGELOG.md` which you can custom. It will be copied to `./CHANGELOG.md` the first time you use the `release` command.

### Add

The `add` command ask you to write a changelog entry, choose an entry type and a branch number (optional).

It will write it in a unique file in `./changelogs/unreleased/`.

```bash
$ npx changelogify add

> test_changelog@1.0.0 changelog /home/robin/Documents/wanadev/test_changelog
> node node_modules/changelogify/index.js "add"

? What's your changelog entry? Feature 1
? Entry type? Added
? What's your git branch number? (Optional) 12
{
    "message": "Feature 1",
    "type": "Added",
    "branch": "12"
}
written in /changelogs/unreleased/12-test-changelogify_1.json

Changelog committed, use `git push` to write it remotely
```

You can also pass parameters to it.

```bash 
$ npx changelogify add --message "Feature 1" --type Added --branch 12
# or
$ npx changelogify add -m "Feature 1" -t Added -b 12
```

And run it on silent mode.

```bash
$ npx changelogify add -m "Feature 1" -t Added -b 12 -s

> test_changelog@1.0.0 changelog /home/robin/Documents/wanadev/test_changelog
> node node_modules/changelogify/index.js "add" "-m" "Feature 1" "-t" "Added" "-b" "12" "-s"
```

### Release

The `release` command merge every changelog files from `./changelogs/unreleased/` and add the new content on `./CHANGELOG.md`.

If `./CHANGELOG.md` doesn't exist, it is created from `./EMPTY_CHANGELOG.md`. Check [init](https://github.com/wanadev/changelogify#init) if you want to use a custom changelog format.

## Changelogs

### 1.2.0 (still wip)

- better handling of branch number beginning by 0 or by letters
- clarify how to link an issue from a branch number
- cleanup: 
  - divide into several files
  - make changelogify an ESM
  - lint
- check for missing config before `add` and `release` commands 

### 1.1.7

- add default command option in config 

### 1.1.6

- fix error on release auto commit when `unrealeased` directory is missing

### 1.1.5

- do not throw error at release when `unrealeased` directory is missing

### 1.1.3

- process exits with non-zero code if an error occurs

### 1.1.2

- synchronous writing in changelog file at release

### 1.1.1

- fix urls in package.json for npm package

### 1.1.0

- throw error when JSON changelog files have wrong format
- remove changelog messages trailing spaces
- display helper when wrong cli argument submitted

### 1.0.1

- add license

### 1.0.0

- initial release