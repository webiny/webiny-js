#!/usr/bin/env node
"use strict";

const chalk = require("chalk");
const execa = require("execa");
const semver = require("semver");
const { verifyConfig } = require("./config");
const currentNodeVersion = process.versions.node;

(async () => {
    if (!semver.satisfies(currentNodeVersion, "^12 || ^14")) {
        console.error(
            chalk.red(
                "You are running Node " +
                    currentNodeVersion +
                    ".\n" +
                    "Webiny requires Node ^12 or ^14. \n" +
                    "Please update your version of Node."
            )
        );
        process.exit(1);
    }

    try {
        const { stdout } = await execa("yarn", ["--version"]);
        if (!semver.satisfies(stdout, "^2||^3")) {
            console.error(chalk.red(`"@webiny/cli" requires yarn ^2 or ^3 to be installed!`));
            process.exit(1);
        }
    } catch (err) {
        console.error(chalk.red(`"@webiny/cli" requires yarn ^2 or ^3 to be installed!`));
        console.log(`Please visit https://yarnpkg.com/ to install "yarn".`);
        process.exit(1);
    }

    await verifyConfig();
    require("./cli");
})();
