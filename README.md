# Changelogify

A basic changelog manager made to avoid conflicts at git merge.

## Install

Add the package to your project as a dev dependency:

    npm install -D https://github.com/wanadev/changelogify

And to your package scripts:

    "scripts": {
        "changelog": "node node_modules/.bin/changelogify"
    },

## Usage

    npm run changelog [options]

    Options: 
        -a, --add [message] Write/overwrite the current git branch changelog file 
                            into ./changelogs/unreleased/
        -r, --release       Concat changelogs file from ./changelogs/unreleased/,
                            add them into ./CHANGELOG.md and delete them

## Example

These three changelogs

```json
{
  "title": "feature 1",
  "type": "Added"
}
```

```json
{
  "title": "feature 2",
  "type": "Added"
}
```

```json
{
  "title": "lint",
  "type": "Meta"
}
```

will be concatenated into `CHANGELOG.md`

    # Changelog

    All notable changes to this project will be documented in this file.

    The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
    and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

    ## [v1.0.0] - 2020-1-29

    ### Added
    - feature 1
    - feature 2
    ### Changed
    ### Deprecated
    ### Removed
    ### Fixed
    ### Security
    ### Meta
    - lint

