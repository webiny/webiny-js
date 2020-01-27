#!/usr/bin/env node
"use strict";

const chalk = require("chalk");
const execa = require("execa");
const { verifyConfig } = require("./config");
const currentNodeVersion = process.versions.node;
const majorVersion = parseInt(currentNodeVersion.split(".")[0]);
const minorVersion = parseInt(currentNodeVersion.split(".")[1]);

(async () => {
    if (majorVersion < 10 || (majorVersion === 10 && minorVersion < 14)) {
        console.error(
            chalk.red(
                "You are running Node " +
                currentNodeVersion +
                ".\n" +
                "Webiny requires Node 10.14 or higher. \n" +
                "Please update your version of Node."
            )
        );
        process.exit(1);
    }

    try {
        await execa("yarn", ["--version"]);
    } catch (err) {
        console.error(
            chalk.red(`"@webiny/cli" depends on "yarn" and its built-in support for workspaces.`)
        );
        console.log(`Please visit https://yarnpkg.com to install "yarn".`);
        process.exit(1);
    }

    verifyConfig();
    require("./cli");
})();
