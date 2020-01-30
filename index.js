const fs = require("fs");

const inquirer = require("inquirer");
const commander = require("commander");

const config = require("./config.json");

const packageJSONPath = `${process.cwd()}/package.json`;
if (!fs.existsSync(packageJSONPath)) {
    console.log("Cannot find package.json in project");
    process.exit();
}
const { version } = require(packageJSONPath);

const today = new Date();
const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

const gitRef = fs.readFileSync(".git/HEAD").toString();
let branchNumber;
branchNumber = gitRef.match(/(\d)+/);
branchNumber = branchNumber ? branchNumber[0] : undefined;

const questions = {
    title: {
      type: "input",
      name: "title",
      message: "What's your changelog entry?",
      default: (commander.add !== true) ? commander.add : undefined
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
        default: `v${version}`
    },
    date: {
        type: "input",
        name: "date",
        message: "What's the release date?",
        default: date
    },
};

commander
    .option('-a, --add [message]', 'write the current git branch changelog file')
    .option('-r, --release', 'concat changelogs file into CHANGELOG.md');

commander.parse(process.argv);

if (commander.add) {
    let fileDir
    let fileName;
    let filePath;

    try {
        fileDir = `${process.cwd()}/changelogs/unreleased/`;

        // create dir if doesn't exist
        fs.existsSync(fileDir) || fs.mkdirSync(fileDir, { recursive: true });
        
        fileName = gitRef.match(/refs\/heads\/((\w|-)+)/)[1];
        filePath = `${fileDir}${fileName}.json`;

        // if file already exists, search for an available name
        let i = 1
        while(fs.existsSync(filePath)) {
            i++;
            filePath = `${fileDir}${fileName}_${i}.json`;
        }
        fileName = `${fileName}_${i}`;
    } catch (error) {
        console.log(error);
        process.exit();
    }
 
    inquirer.prompt(questions.title).then(({ title }) => {
        if (title === "") {
            console.log('Changelog title cannot be empty');
            process.exit();
        };

        return inquirer.prompt([questions.type, questions.branch]).then(({ type, branch }) => {
            const data = JSON.stringify({ title, type, branch }, null, '  ');
            fs.writeFile(filePath, data, (error) => { 
                if (error) throw error;
            });
            console.log(`${data}\nwritten in /changelogs/unreleased/${fileName}.json`);
        });
    }).catch((error) => {
        console.log(error);
        process.exit();
    });
    
} else if (commander.release) {
    let beginningText;
    let endText = "";
    let formattedData;
    const filePath = `${process.cwd()}/CHANGELOG.md`;
    const fileDir = `${process.cwd()}/changelogs/unreleased/`;

    try {
        let changelog;
        
        if (fs.existsSync(filePath)) {
            changelog = fs.readFileSync(filePath, 'utf8');
            const match = changelog.toString().match(/((.|\s)+?){1}((## (.|\s)+)|\Z)/);
            beginningText = match[1];
            endText = match[3];
        } else {
            beginningText = fs.readFileSync(`${__dirname}/EMPTY_CHANGELOG.md`, 'utf8');
        }
    
        const changelogs = fs.readdirSync(fileDir).map(file => JSON.parse(fs.readFileSync(`${fileDir}/${file}`, 'utf8')));
        
        const data = changelogs.reduce((acc, { title, type, branch }) => {
            if (!acc[type]) acc[type] = [];
            acc[type].push({ title, branch});
            return acc;
        }, {})
    
        formattedData = config.types.reduce((text, type) => {
            if (data[type]) {
                text += `### ${type}\n`;
                data[type].forEach(({ title, branch }) => {
                    if (branch === "" || !config.gitIssueTemplate) {
                        return text += `- ${title}\n`;
                    }
                    const link = config.gitIssueTemplate.replace(/branch/gi, branch);
                    return text += `- ${title} - ${link}\n`;
                });
            }
            return text;
        }, "");
    } catch (error) {
        console.error(error);
        process.exit(); 
    }
    
    inquirer.prompt([questions.version, questions.date]).then(({ version, date }) => {
        const data = `## [${version}] - ${date}\n\n${formattedData}\n`;
        const text = `${beginningText}${data}${endText}`;

        fs.writeFile(filePath, text, (error) => { 
            if (error) throw error; 
        });
        console.log(`${data}\nappended in /CHANGELOG.md`);
    }).then(() => {
        // delete JSON changelog files
        fs.readdirSync(fileDir).forEach(file => {
            fs.access(`${fileDir}/${file}`, error => {
                if (!error) {
                    fs.unlinkSync(`${fileDir}/${file}`, (error) => { throw error });
                } else {
                    throw error;
                }
            });
        })
    }).catch((error) => {
        console.log(error);
        process.exit();
    });
    
} else {
    commander.help();
}