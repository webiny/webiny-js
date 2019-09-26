const path = require("path");
import get from "lodash.get";
const terminalLink = require("terminal-link");
const chalk = require("chalk");

const getConfig = require("./getConfig");

module.exports = async name => {
    const { config, filepath } = await getConfig();

    const appConfig = get(config.apps, name);
    if (!appConfig) {
        const link = terminalLink(chalk.red(path.basename(filepath)), "file://" + filepath);
        const msg = chalk.red(
            `Configuration for app "${name}" not found. Please check your ${link} file.`
        );

        // eslint-disable-next-line
        console.log(msg);
        process.exit(1);
    }

    return appConfig;
};
