const fs = require("fs");

const inquirer = require("inquirer");
const commander = require("commander");
const git = require("simple-git/promise");

const ERROR_CODE = {
    NO_PACKAGE_JSON: 1,
    SILENT_ADD: 2,
    EMPTY_MESSAGE: 3,
    INIT_ERROR: -1,
    ADD_ERROR: -2,
    RELEASE_ERROR: -3,
}

async function begin() {
    const paths = {
        defaultConfig: `${__dirname}/config.json`,
        userConfig: `${process.cwd()}/changelogs/config.json`,
        changelogsDir: `${process.cwd()}/changelogs/`,
        unreleasedChangelogsDir: `${process.cwd()}/changelogs/unreleased/`,
        changelog: `${process.cwd()}/CHANGELOG.md`,
        emptyChangelog: `${__dirname}/EMPTY_CHANGELOG.md`,
    };

    const config = fs.existsSync(paths.userConfig) ? require(paths.userConfig) : require(paths.defaultConfig);

    const gitBranch = await git().silent(true).raw(["symbolic-ref", "--short", "HEAD"]);
    let branchNumber = gitBranch.match(/(\d)+/);
    branchNumber = branchNumber ? branchNumber[0] : undefined;
    
    const packageJSONPath = `${process.cwd()}/package.json`;
    if (!fs.existsSync(packageJSONPath)) {
        console.log("Cannot find package.json in project");
        process.exit(ERROR_CODE.NO_PACKAGE_JSON);
    }
    const { version } = require(packageJSONPath);
    const currentVersion = `v${version}`;

    const today = new Date();
    const currentDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

    const questions = {
        writeConfig: {
            type: "confirm",
            name: "writeConfig",
            message: "Changelog config already exists in your project. Write new settings?",
            default: false
        },
        message: {
            type: "input",
            name: "message",
            message: "What's your changelog entry?",
        },
        type: {
            type: 'list',
            name: 'type',
            message: 'Entry type?',
            choices: config.types,
        },
        branch: {
            type: "input",
            name: "branch",
            message: "What's your git branch number? (Optional)",
            default: branchNumber
        },
        version: {
            type: "input",
            name: "version",
            message: "What's the release version?",
            default: currentVersion
        },
        date: {
            type: "input",
            name: "date",
            message: "What's the release date?",
            default: currentDate
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
    }
};

async function init() {
    try {
        const {
            paths, 
            config,
            questions,
        } = await begin();

        // create dir if doesn't exist
        fs.existsSync(paths.changelogsDir) || fs.mkdirSync(paths.changelogsDir);

        if (!fs.existsSync(paths.userConfig)) {
            fs.copyFileSync(paths.defaultConfig, paths.userConfig, { encoding:'utf8', flag:'w' });
            console.log(`\nDefault configuration copied.\nYou can overwrite it in ${paths.userConfig}`);
        } else {
            const { writeConfig } = await inquirer.prompt(questions.writeConfig);
            if(!writeConfig) return;
            const defaultConfig = require(paths.defaultConfig);
            const newConfig = Object.assign({}, defaultConfig, config);
            const data = JSON.stringify(newConfig, null, 4);
            fs.writeFile(paths.userConfig, data, (error) => { 
                if (error) throw error; 
            });
            console.log(`\nNew configuration append.\nYou can overwrite it in ${paths.userConfig}`);
        }
    } catch (error) {
        console.log(error);
        process.exit(ERROR_CODE.INIT_ERROR);
    }
};

async function add({ message, type, branch, silent }) {

    if (silent && (!message || !type)) {
        console.log("In silent mode, log message, type and branch number need to be provided in the command line");
        process.exit(ERROR_CODE.SILENT_ADD);
    }

    try {
        const {
            paths, 
            config,
            gitBranch,
            branchNumber,
            questions,
        } = await begin();
    
        // create dir if doesn't exist
        fs.existsSync(paths.unreleasedChangelogsDir) || fs.mkdirSync(paths.unreleasedChangelogsDir, { recursive: true });
        
        fileName = gitBranch.match(/((\w|-)+)/)[1];

        // if file already exists, search for an available name
        let i = 1
        filePath = `${paths.unreleasedChangelogsDir}${fileName}_${i}.json`;

        while(fs.existsSync(filePath)) {
            i++;
            filePath = `${paths.unreleasedChangelogsDir}${fileName}_${i}.json`;
        }
        fileName = `${fileName}_${i}`;
    
        if (!message) {
            answers = await inquirer.prompt(questions.message);
            message = answers.message.trim();
        }
        if (message === "" || !message) {
            console.log('Changelog title cannot be empty');
            process.exit(ERROR_CODE.EMPTY_MESSAGE);
        };
    
        if (!type) {
            const answers = await inquirer.prompt(questions.type);
            type = answers.type;
        }

        if (!branch) {
            if (silent) branch = branchNumber;
            else {
                const answers = await inquirer.prompt(questions.branch);
            branch = answers.branch;
            }
        }

        const data = JSON.stringify({ message, type, branch }, null, 4);
        fs.writeFileSync(filePath, data);
        if (!silent) console.log(`${data}\nwritten in /changelogs/unreleased/${fileName}.json\n`);
    
        if (config.autoCommitAdd) {
            const commitMessage = config.changelogMessageAdd && branch
                ? config.changelogMessageAdd.replace(/BRANCH/g, branch)
                : "changelog";
            await git().silent(true).add([filePath, paths.userConfig]);
            await git().silent(true).commit(commitMessage);
            if (!silent) console.log("Changelog committed, use \`git push\` to write it remotely");
        }
    } catch (error) {
        console.log(error);
        process.exit(ERROR_CODE.ADD_ERROR);
    }
};

async function release({ releaseVersion, date, silent }) {

    try {
        const {
            paths, 
            config,
            questions,
            currentVersion,
            currentDate,
        } = await begin();

        let beginningText;
        let endText = "";
        let formattedData;
        let changelog;
        
        if (fs.existsSync(paths.changelog)) {
            changelog = fs.readFileSync(paths.changelog, 'utf8');
            const match = changelog.toString().match(/((.|\s)+?){1}((## (.|\s)+)|\Z)/);
            beginningText = match[1];
            endText = match[3];
        } else {
            beginningText = fs.readFileSync(paths.emptyChangelog, 'utf8');
        }

        _checkJsonFormat = (content) => {
            if (!content.message && !content.type) return "missing \"message\" and \"type\" keys";
            if (!content.message) return "missing \"message\" key";
            if (!content.type) return "missing \"type\" key";
            if (!config.types.includes(content.type)) return "unknown type";
            return "";
        };

        const formatErrors = [];
        const hasUnreleasedDir = fs.existsSync(paths.unreleasedChangelogsDir);
        const changelogs = hasUnreleasedDir
            ? fs.readdirSync(paths.unreleasedChangelogsDir)
            : []
            .map((file) => {
                const content = JSON.parse(fs.readFileSync(`${paths.unreleasedChangelogsDir}${file}`, 'utf8'));
                const error = _checkJsonFormat(content);
                if (error === "") return content;
                formatErrors.push(`${file}: ${error}`);
            });

        if (formatErrors.length) {
            throw new Error(`Wrong changelog files format\nIn ${paths.unreleasedChangelogsDir}${formatErrors.reduce((acc, err) => `${acc}\n - ${err}`, "")}`);
        }
        
        const data = changelogs.reduce((acc, { message, type, branch }) => {
            if (!acc[type]) acc[type] = [];
            acc[type].push({ message, branch });
            return acc;
        }, {})

        formattedData = config.types.reduce((text, type) => {
            if (data[type]) {
                text += `### ${type}\n`;
                data[type].forEach(({ message, branch }) => {
                    if (branch === "" || !config.gitIssueTemplate) {
                        return text += `- ${message}\n`;
                    }
                    const link = config.gitIssueTemplate.replace(/BRANCH/g, branch);
                    return text += `- ${message} - ${link}\n`;
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
        if (!silent) console.log(`${formattedChangelogs}\nappended in /CHANGELOG.md`);

        // delete JSON changelog files
        if (hasUnreleasedDir) {
            fs.readdirSync(paths.unreleasedChangelogsDir).forEach((file) => {
                fs.access(`${paths.unreleasedChangelogsDir}${file}`, error => {
                    if (!error) {
                        fs.unlinkSync(`${paths.unreleasedChangelogsDir}/${file}`, (error) => { throw error });
                    } else {
                        throw error;
                    }
                });
            });
        }

        if (config.autoCommitRelease) {
            const message = config.changelogMessageRelease || "changelog";
            const filesToCommit = [paths.changelog, paths.userConfig];
            if (hasUnreleasedDir) filesToCommit.unshift(paths.unreleasedChangelogsDir);

            await git().silent(true).add(filesToCommit);
            await git().silent(true).commit(message);
            if (!silent) console.log("Changelog committed, use \`git push\` to write it remotely");
        }
    } catch (error) {
        console.log(error);
        process.exit(ERROR_CODE.RELEASE_ERROR);
    }
};

async function main() {

    commander
        .command("init")
        .description("copy default config into package")
        .action(init);
    commander
        .command("add")
        .description("write the current git branch changelog file")
        .option("-m, --message <string>", "provide changelog message")
        .option("-t, --type <string>", "provide chagelog type (e.g. \"Added\"")
        .option("-b, --branch <number>", "provide the branch number")
        .option("-s, --silent", "run in silent mode using default parameters. Uses current branch number, need to pass message and type")
        .action(add);
    commander
        .command("release")
        .description("concat changelog files into CHANGELOG.md")
        .option("-v, --releaseVersion <version>", "provide release version")
        .option("-d, --date <date>", "provide release date")
        .option("-s, --silent", "run in silent mode using default parameters. Uses current version and date")
        .action(release);

    commander.allowUnknownOption(false);

    const args = await commander.parseAsync(process.argv);

    if (!args.length) {
        commander.outputHelp();
    }
};

main();
