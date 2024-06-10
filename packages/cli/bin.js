#!/usr/bin/env node
"use strict";

const chalk = require("chalk");
const execa = require("execa");
const semver = require("semver");
const currentNodeVersion = process.versions.node;

(async () => {
    if (!semver.satisfies(currentNodeVersion, ">=14")) {
        console.error(
            chalk.red(
                [
                    `You are running Node.js ${currentNodeVersion}, but Webiny requires version 14 or higher.`,
                    `Please switch to one of the required versions and try again.`,
                    `For more information, please visit https://www.webiny.com/docs/get-started/install-webiny#prerequisites.`
                ].join(" ")
            )
        );
        process.exit(1);
    }

    try {
        const { stdout } = await execa("yarn", ["--version"]);
        if (!semver.satisfies(stdout, ">=3")) {
            console.error(chalk.red(`"@webiny/cli" requires yarn 3 or 4!`));
            process.exit(1);
        }
    } catch (err) {
        console.error(chalk.red(`"@webiny/cli" requires yarn 3 or 4!`));
        console.log(
            `Run ${chalk.blue("yarn set version berry")} to install a compatible version of yarn.`
        );
        process.exit(1);
    }

    require("./cli");
})();
