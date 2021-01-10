const { join } = require("path");
const chalk = require("chalk");
const { allPackages } = require("@webiny/project-utils/packages");

const outputJSON = obj => {
    console.log(JSON.stringify(obj, null, 2));
};

module.exports = async ({ json, withPath }) => {
    const packages = allPackages().reduce((acc, folder) => {
        const json = require(join(folder, "package.json"));
        acc[json.name] = folder;
        return acc;
    }, {});

    if (json) {
        // `withPath` outputs a key => value object, containing workspace name and absolute path
        if (withPath) {
            outputJSON(packages);
        } else {
            outputJSON(Object.keys(packages));
        }
        return;
    }

    Object.keys(packages).forEach(name => {
        if (withPath) {
            console.log(`${chalk.green(name)} (${chalk.blue(packages[name])})`);
        } else {
            console.log(chalk.green(name));
        }
    });
};
