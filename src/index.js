#!/usr/bin/env node

import fs from "fs";

import commander from "commander";
import git from "simple-git";
import path from "path";
import url from "url";

import init from "./init.js";
import add from "./add.js";
import release from "./release.js";
import constants from "./constants.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { ERROR_CODE } = constants;

async function begin() {
    const paths = {
        defaultConfig: `${__dirname}/config.json`,
        userConfig: `${process.cwd()}/changelogs/config.json`,
        changelogsDir: `${process.cwd()}/changelogs/`,
        unreleasedChangelogsDir: `${process.cwd()}/changelogs/unreleased/`,
        changelog: `${process.cwd()}/CHANGELOG.md`,
        emptyChangelog: `${__dirname}/EMPTY_CHANGELOG.md`,
        packageJson: `${process.cwd()}/package.json`,
    };

    const configPath = fs.existsSync(paths.userConfig) ? paths.userConfig : paths.defaultConfig;

    const config = JSON.parse(await fs.promises.readFile(new URL(configPath, import.meta.url)));

    const gitBranch = await git().silent(true).raw(["symbolic-ref", "--short", "HEAD"]);
    let branchNumber = gitBranch.match(/(\d)+/);
    branchNumber = branchNumber && Number(branchNumber[0]) ? branchNumber[0] : undefined;

    if (!fs.existsSync(paths.packageJson)) {
        console.info("Cannot find package.json in project");
        process.exit(ERROR_CODE.NO_PACKAGE_JSON);
    }
    const { version } = JSON.parse(await fs.promises.readFile(new URL(paths.packageJson, import.meta.url)));
    const currentVersion = `v${version}`;

    const today = new Date();
    const currentDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    const questions = {
        writeConfig: {
            type: "confirm",
            name: "writeConfig",
            message: "Config file already exists. Write new settings? (This will not overwrite existing ones)",
            default: false,
        },
        message: {
            type: "input",
            name: "message",
            message: "What's your changelog entry?",
        },
        type: {
            type: "list",
            name: "type",
            message: "Entry type?",
            choices: config.types,
        },
        issue: {
            type: "input",
            name: "issue",
            message: "What's your git issue number? (Optional)",
            default: branchNumber,
        },
        version: {
            type: "input",
            name: "version",
            message: "What's the release version?",
            default: currentVersion,
        },
        date: {
            type: "input",
            name: "date",
            message: "What's the release date?",
            default: currentDate,
        },
    };

    return {
        paths,
        config,
        gitBranch,
        branchNumber,
        questions,
        currentVersion,
        currentDate,
    };
}

async function main() {
    let options;

    try {
        options = await begin();
    } catch (error) {
        console.info(error);
        process.exit(ERROR_CODE.CONFIG_ERROR);
    }

    commander
        .command("init")
        .description("copy default config into package")
        .action(() => init(options));
    commander
        .command("add")
        .description("write the current git branch changelog file")
        .option("-m, --message <string>", "provide changelog message")
        .option("-t, --type <string>", "provide chagelog type (e.g. \"Added\"")
        .option("-i, --issue <number>", "provide the issue number")
        .option("-s, --silent", "run in silent mode using default parameters. Uses current branch number as issue number, need to pass message and type")
        .action((args) => add(args, options));
    commander
        .command("release")
        .description("concat changelog files into CHANGELOG.md")
        .option("-v, --releaseVersion <version>", "provide release version")
        .option("-d, --date <date>", "provide release date")
        .option("-s, --silent", "run in silent mode using default parameters. Uses current version and date")
        .action((args) => release(args, options));

    commander.allowUnknownOption(false);

    const argv = process.argv.length > 2
        ? process.argv
        : process.argv.concat(options.config.defaultCommand);

    const args = await commander.parseAsync(argv);

    if (!args.length) {
        commander.outputHelp();
    }
}

main();
