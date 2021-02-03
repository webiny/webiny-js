#!/usr/bin/env node
"use strict";

const chalk = require("chalk");
const execa = require("execa");
const semver = require("semver");
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
        const { stdout } = await execa("yarn", ["--version"]);
        if (!semver.satisfies(stdout, "^2")) {
            console.error(chalk.red(`"@webiny/cli" requires yarn@^2 to be installed!`));
            process.exit(1);
        }
    } catch (err) {
        console.error(chalk.red(`"@webiny/cli" requires yarn@^2 to be installed!`));
        console.log(`Please visit https://yarnpkg.com/ to install "yarn@^2".`);
        process.exit(1);
    }

    await verifyConfig();
    require("./cli");
})();
