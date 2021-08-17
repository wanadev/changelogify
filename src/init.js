import fs from "fs";
import inquirer from "inquirer";

import constants from "./constants.js";

const { ERROR_CODE } = constants;

async function init(options) {
    try {
        const {
            paths,
            questions,
            config,
        } = options;

        // create dir if doesn't exist
        if (!fs.existsSync(paths.changelogsDir)) {
            fs.mkdirSync(paths.changelogsDir);
        }

        if (!fs.existsSync(paths.userConfig)) {
            fs.copyFileSync(paths.defaultConfig, paths.userConfig);
            console.info(`\nDefault configuration copied.\nYou can overwrite it in ${paths.userConfig}`);
        } else {
            const { writeConfig } = await inquirer.prompt(questions.writeConfig);
            if (!writeConfig) return;
            const defaultConfig = JSON.parse(await fs.promises.readFile(new URL(paths.defaultConfig, import.meta.url)));
            const newConfig = { ...defaultConfig, ...config };
            const data = JSON.stringify(newConfig, null, 4);
            fs.writeFile(paths.userConfig, data, (error) => {
                if (error) throw error;
            });
            console.info(`\nNew configuration append.\nYou can overwrite it in ${paths.userConfig}`);
        }
    } catch (error) {
        console.info(error);
        process.exit(ERROR_CODE.INIT_ERROR);
    }
}

export default init;
