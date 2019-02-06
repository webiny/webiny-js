#!/usr/bin/env node
const execa = require("execa");
const { basename } = require("path");
const chalk = require("chalk");
const getPackages = require("get-yarn-workspaces");

const blacklist = [
    // Client
    "webiny-app",
    "webiny-app-admin",
    "webiny-app-cms",
    "webiny-ui",
    "webiny-form",
    "webiny-react-router"
];

/**
 * Get a list of packages in form: `packages/webiny-ui` and `independent/webiny-integration-....`
 * @returns Array<String>
 */
function listPackages() {
    return getPackages()
        .filter(path => !blacklist.includes(basename(path)))
        .map(dir => dir.replace(process.cwd() + "/", ""));
}

function checkPackage(path) {
    const command = `cd ${path}/src && find . -type f | xargs grep -H -c '@flow' | grep 0$ | cut -d':' -f1`;
    return execa.shellSync(command);
}

const packages = {
    list: listPackages(),
    invalid: []
};

for (let i = 0; i < packages.list.length; i++) {
    let name = packages.list[i];
    const files = checkPackage(name).stdout;
    if (!files.length) {
        continue;
    }

    packages.invalid.push({ name, files });
}

if (packages.invalid.length) {
    // eslint-disable-next-line
    console.log(
        chalk.red(
            `The following packages (${packages.invalid.length}) are missing @flow implementation:`
        )
    );

    // eslint-disable-next-line
    console.log(chalk.red("┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"));
    for (let i = 0; i < packages.invalid.length; i++) {
        let pckg = packages.invalid[i];

        // eslint-disable-next-line
        console.log(chalk.red(pckg.name));

        // eslint-disable-next-line
        console.log(pckg.files);
    }
} else {
    // eslint-disable-next-line
    console.log(chalk.green("All packages have @flow implemented, good job!"));
}
