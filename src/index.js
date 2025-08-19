#!/usr/bin/env node

import { program } from "commander";

import { begin, checkConfig } from "./begin.js";
import init from "./init.js";
import add from "./add.js";
import release from "./release.js";
import constants from "./constants.js";

const { ERROR_CODE } = constants;

async function main() {
    let options;

    try {
        options = await begin();
    } catch (error) {
        console.info(error);
        process.exit(ERROR_CODE.CONFIG_ERROR);
    }

    program
        .command("init")
        .description("copy default config into package")
        .action(() => init(options));

    program
        .command("add")
        .description("write the current git branch changelog file")
        .option("-m, --message <string>", "provide changelog message")
        .option("-t, --type <string>", "provide chagelog type (e.g. \"Added\"")
        .option("-i, --issue <number>", "provide the issue number")
        .option("-s, --silent", "run in silent mode using default parameters. Uses current branch number as issue number, need to pass message and type")
        .action(async (args) => {
            await checkConfig(options);
            add(args, options);
        });

    program
        .command("release")
        .description("concat changelog files into CHANGELOG.md")
        .option("-v, --releaseVersion <version>", "provide release version")
        .option("-d, --date <date>", "provide release date")
        .option("-s, --silent", "run in silent mode using default parameters. Uses current version and date")
        .action(async (args) => {
            await checkConfig(options);
            release(args, options);
        });

    program.allowUnknownOption(false);

    const argv = process.argv.length > 2
        ? process.argv
        : process.argv.concat(options.config.defaultCommand);

    const args = await program.parseAsync(argv);

    if (!args.length) {
        program.outputHelp();
    }
}

main();
