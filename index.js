const fs = require("fs") ;

const inquirer = require("inquirer");
const commander = require("commander");

const config = require("./config.json");

const packageJSONPath = `${process.cwd()}/package.json`;
if (!fs.existsSync(packageJSONPath)) {
    console.log("Cannot find package.json in project");
    process.exit();
}
const { version } = require(packageJSONPath);


commander
    .option('-a, --add [message]', 'write the current git branch changelog file')
    .option('-r, --release', 'concat changelogs file into CHANGELOG.md');

commander.parse(process.argv);

if (commander.add) {

    const questions = [
        {
            type: "confirm",
            name: "overwrite",
            message: "Changelog entry already exists for this branch. Overwrite?",
            default: true
        },
        {
          type: "input",
          name: "title",
          message: "What's your changelog entry?",
          default: (commander.add !== true) ? commander.add : undefined
        },
        {
          type: 'list',
          name: 'type',
          message: 'Entry type?',
          choices: config.types,
        },
    ];

    let fileName;
    let filePath;

    try {
        const fileDir = `${process.cwd()}/changelogs/unreleased/`;

        // create dir if doesn't exist
        fs.existsSync(fileDir) || fs.mkdirSync(fileDir, { recursive: true });
        
        const gitRef = fs.readFileSync(".git/HEAD").toString();
        fileName = gitRef.match(/refs\/heads\/((\w|-)+)/)[1];
        filePath = `${fileDir}${fileName}.json`;
    } catch (error) {
        console.log(error);
        process.exit();
    }

    // check changelog entry for this git branch 
    (fs.existsSync(filePath) 
        ? inquirer.prompt(questions[0]).then(({ overwrite }) => {
            if (!overwrite) process.exit();
        })
        : Promise.resolve()
    ).then(() => {
        return inquirer.prompt(questions[1]).then(({ title }) => {
            if (title === "") {
                console.log('Changelog title cannot be empty');
                process.exit();
            };

            return inquirer.prompt(questions[2]).then(({ type }) => {
                const data = JSON.stringify({ title, type }, null, '  ');
                fs.writeFile(filePath, data, (error) => { 
                    if (error) throw error;
                });
                console.log(`${data}\nwritten in /changelogs/unreleased/${fileName}.json`);
            });
        });
    }).catch((error) => {
        console.log(error);
        process.exit();
    });
    
    
} else if (commander.release) {
    const today = new Date();
    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

    const questions = [
        {
            type: "input",
            name: "version",
            message: "What's the release version?",
            default: `v${version}`
        },
        {
            type: "input",
            name: "date",
            message: "What's the release date?",
            default: date
        },
    ];

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
        
        const data = changelogs.reduce((acc, { title, type }) => {
            if (!acc[type]) acc[type] = [title];
            else acc[type].push(title);
            return acc;
        }, {})
    
        formattedData = config.types.reduce((text, type) => {
            text += `### ${type}\n`;
            if (data[type]) data[type].forEach(entry => text += `- ${entry}\n`);
            return text;
        }, "");
    } catch (error) {
        console.error(error);
        process.exit(); 
    }
    
    inquirer.prompt(questions).then(({ version, date }) => {
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