import fs from "fs";
import inquirer from "inquirer";
import git from "simple-git";

import constants from "./constants.js";

const { ERROR_CODE } = constants;

async function add({ message, type, issue, silent }, options) {
    if (silent && (!message || !type)) {
        console.info("In silent mode, log message, type and branch number need to be provided in the command line");
        process.exit(ERROR_CODE.SILENT_ADD);
    }

    const {
        paths,
        gitBranch,
        branchNumber,
        questions,
        config,
    } = options;

    try {
        // create dir if doesn't exist
        if (!fs.existsSync(paths.unreleasedChangelogsDir)) {
            fs.mkdirSync(paths.unreleasedChangelogsDir, { recursive: true });
        }

        let fileName = gitBranch.match(/((\w|-)+)/)[1];

        // if file already exists, search for an available name
        let i = 1;
        let filePath = `${paths.unreleasedChangelogsDir}${fileName}_${i}.json`;

        while (fs.existsSync(filePath)) {
            i += 1;
            filePath = `${paths.unreleasedChangelogsDir}${fileName}_${i}.json`;
        }
        fileName = `${fileName}_${i}`;

        if (!message) {
            const answers = await inquirer.prompt(questions.message);
            message = answers.message.trim();
        }
        if (message === "" || !message) {
            console.info("Changelog title cannot be empty");
            process.exit(ERROR_CODE.EMPTY_MESSAGE);
        }

        if (!type) {
            const answers = await inquirer.prompt(questions.type);
            type = answers.type;
        }

        if (!issue) {
            if (silent) issue = branchNumber;
            else {
                const answers = await inquirer.prompt(questions.issue);
                issue = answers.issue;
            }
        }

        const data = JSON.stringify({ message, type, issue }, null, 4);
        fs.writeFileSync(filePath, data);
        if (!silent) console.info(`${data}\nwritten in /changelogs/unreleased/${fileName}.json\n`);

        if (config.autoCommitAdd) {
            const commitMessage = config.changelogMessageAdd && issue
                ? config.changelogMessageAdd.replace(/NUMBER/g, issue)
                : "changelog";
            await git().silent(true).add([filePath, paths.userConfig]);
            await git().silent(true).commit(commitMessage);
            if (!silent) console.info("Changelog committed, use `git push` to write it remotely");
        }
    } catch (error) {
        console.info(error);
        process.exit(ERROR_CODE.ADD_ERROR);
    }
}

export default add;
