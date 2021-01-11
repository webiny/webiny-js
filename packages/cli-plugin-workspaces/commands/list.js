const { join } = require("path");
const chalk = require("chalk");
const { allWorkspaces } = require("@webiny/project-utils/workspaces");

const outputJSON = obj => {
    console.log(JSON.stringify(obj, null, 2));
};

module.exports = async ({ json, withPath }) => {
    const workspaces = allWorkspaces().reduce((acc, folder) => {
        const json = require(join(folder, "package.json"));
        acc[json.name] = folder;
        return acc;
    }, {});

    if (json) {
        // `withPath` outputs a key => value object, containing workspace name and absolute path
        if (withPath) {
            outputJSON(workspaces);
        } else {
            outputJSON(Object.keys(workspaces));
        }
        return;
    }

    Object.keys(workspaces).forEach(name => {
        if (withPath) {
            console.log(`${chalk.green(name)} (${chalk.blue(workspaces[name])})`);
        } else {
            console.log(chalk.green(name));
        }
    });
};
