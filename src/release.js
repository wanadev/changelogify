import fs from "fs";
import inquirer from "inquirer";
import git from "simple-git";

import constants from "./constants.js";

const { ERROR_CODE } = constants;

const checkJsonFormat = (content, types) => {
    if (!content.message && !content.type) return "missing \"message\" and \"type\" keys";
    if (!content.message) return "missing \"message\" key";
    if (!content.type) return "missing \"type\" key";
    if (!types.includes(content.type)) return "unknown type";
    return "";
};

async function release({ releaseVersion, date, silent }, options) {
    try {
        const {
            paths,
            questions,
            currentVersion,
            currentDate,
            config,
        } = options;

        let beginningText;
        let endText = "";
        let changelog;

        if (fs.existsSync(paths.changelog)) {
            changelog = fs.readFileSync(paths.changelog, "utf8");
            const match = changelog.toString().match(/((.|\s)+?){1}((## (.|\s)+))/);
            beginningText = match[1];
            endText = match[3];
        } else {
            beginningText = fs.readFileSync(paths.emptyChangelog, "utf8");
        }

        const hasUnreleasedDir = fs.existsSync(paths.unreleasedChangelogsDir);
        const changelogFiles = hasUnreleasedDir
            ? fs.readdirSync(paths.unreleasedChangelogsDir)
            : [];

        const { changelogs, formatErrors } = changelogFiles.reduce((acc, file) => {
            const content = JSON.parse(fs.readFileSync(`${paths.unreleasedChangelogsDir}${file}`, "utf8"));
            const error = checkJsonFormat(content, config.types);
            if (error === "") acc.changelogs.push(content);
            else acc.formatErrors.push(`${file}: ${error}`);
            return acc;
        }, { changelogs: [], formatErrors: [] });

        if (formatErrors.length) {
            const errors = formatErrors.reduce((acc, err) => `${acc}\n - ${err}`, "");
            throw new Error(`Wrong changelog files format\nIn ${paths.unreleasedChangelogsDir}${errors}`);
        }

        const data = changelogs.reduce((acc, { message, type, issue, branch }) => {
            const issueNumber = issue ?? branch; // retrocompatibility
            if (!acc[type]) acc[type] = [];
            acc[type].push({ message, issueNumber });
            return acc;
        }, {});

        const formattedData = config.types.reduce((text, type) => {
            if (data[type]) {
                text += `### ${type}\n`;
                data[type].forEach(({ message, issueNumber }) => {
                    if (issueNumber === "" || !config.gitIssueTemplate) {
                        text = `${text}- ${message}\n`;
                    } else {
                        const link = config.gitIssueTemplate.replace(/NUMBER/g, issueNumber);
                        text = `${text}- ${message} - ${link}\n`;
                    }
                });
            }
            return text;
        }, "");

        if (!releaseVersion) {
            if (silent) releaseVersion = currentVersion;
            else {
                const answers = await inquirer.prompt(questions.version);
                releaseVersion = answers.version;
            }
        }

        if (!date) {
            if (silent) date = currentDate;
            else {
                const answers = await inquirer.prompt(questions.date);
                date = answers.date;
            }
        }

        const formattedChangelogs = `## [${releaseVersion}] - ${date}\n\n${formattedData}\n`;

        const text = `${beginningText}${formattedChangelogs}${endText}`;

        fs.writeFileSync(paths.changelog, text);
        if (!silent) console.info(`${formattedChangelogs}\nappended in /CHANGELOG.md`);

        // delete JSON changelog files
        changelogFiles.forEach((file) => {
            fs.access(`${paths.unreleasedChangelogsDir}${file}`, (error) => {
                if (!error) {
                    fs.unlinkSync(`${paths.unreleasedChangelogsDir}/${file}`, (err) => { throw err; });
                } else {
                    throw error;
                }
            });
        });

        if (config.autoCommitRelease) {
            const message = config.changelogMessageRelease || "changelog";
            const filesToCommit = [paths.changelog, paths.userConfig];
            if (hasUnreleasedDir) filesToCommit.unshift(paths.unreleasedChangelogsDir);

            await git().add(filesToCommit);
            await git().commit(message);
            if (!silent) console.info("Changelog committed, use `git push` to write it remotely");
        }
    } catch (error) {
        console.info(error);
        process.exit(ERROR_CODE.RELEASE_ERROR);
    }
}

export default release;
