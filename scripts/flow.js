#!/usr/bin/env node
const execa = require("execa");
const { readdirSync, statSync } = require("fs");
const { join } = require("path");
const chalk = require("chalk");

const blacklist = [
    // Client
    "webiny-app",
    "webiny-app-admin",
    "webiny-app-cms",
    "webiny-ui",
    "webiny-form",
    "webiny-react-router"
];

function listPackages(p) {
    return readdirSync(p)
        .filter(f => statSync(join(p, f)).isDirectory())
        .filter(f => !blacklist.includes(f));
}

function checkPackage(name) {
    const command = `cd packages/${name}/src && find . -type f | xargs grep -H -c '@flow' | grep 0$ | cut -d':' -f1`;
    return execa.shellSync(command);
}

const packages = {
    list: listPackages("./packages"),
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
            `Following packages (${packages.invalid.length}) are missing @flow implementation:`
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
