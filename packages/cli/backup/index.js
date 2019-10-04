#!/usr/bin/env node
"use strict";

const chalk = require("chalk");
const execa = require("execa");
const currentNodeVersion = process.versions.node;
const majorVersion = parseInt(currentNodeVersion.split(".")[0]);
const minorVersion = parseInt(currentNodeVersion.split(".")[1]);

require("dotenv").config();

(async () => {
    if (majorVersion < 8 || (majorVersion === 8 && minorVersion < 10)) {
        console.error(
            chalk.red(
                "You are running Node " +
                    currentNodeVersion +
                    ".\n" +
                    "Webiny requires Node 8.10 or higher. \n" +
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

    require("./cli");
})();
