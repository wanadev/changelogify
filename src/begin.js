import fs from "fs";
import git from "simple-git";
import path from "path";
import url from "url";

import constants from "./constants.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { ERROR_CODE } = constants;

async function checkConfig(options) {
    if (!fs.existsSync(options.paths.userConfig)) {
        console.info("You need to install the changelogify configuration to your project,\nPlease run the `init` command first.");
        process.exit();
    }
    const defaultConfig = JSON.parse(await fs.promises.readFile(options.paths.defaultConfig));

    const configKeys = Object.keys(options.config);
    const defaultConfigKeys = Object.keys(defaultConfig);

    const configUpToDate = defaultConfigKeys.every((key) => configKeys.includes(key));

    if (!configUpToDate) {
        console.info("You need to update the changelogify configuration of your project,\nPlease run the `init` command first.");
        process.exit();
    }
}

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

    const config = JSON.parse(await fs.promises.readFile(configPath));

    const gitBranch = await git().silent(true).raw(["symbolic-ref", "--short", "HEAD"]);
    let branchNumber = gitBranch.match(/(\d)+/);
    branchNumber = branchNumber && Number(branchNumber[0]) ? branchNumber[0] : undefined;

    if (!fs.existsSync(paths.packageJson)) {
        console.info("Cannot find package.json in project");
        process.exit(ERROR_CODE.NO_PACKAGE_JSON);
    }
    const { version } = JSON.parse(await fs.promises.readFile(paths.packageJson));
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

export { begin, checkConfig };
