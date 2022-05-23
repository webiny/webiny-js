#!/usr/bin/env node
"use strict";

const semver = require("semver");
const chalk = require("chalk");
const getYarnVersion = require("./utils/getYarnVersion");
const verifyConfig = require("./utils/verifyConfig");

(async () => {
    const nodeVersion = process.versions.node;
    if (!semver.satisfies(nodeVersion, ">=14")) {
        console.error(
            chalk.red(
                [
                    `You are running Node.js ${nodeVersion}, but Webiny requires version 14 or higher.`,
                    `Please switch to one of the required versions and try again.`,
                    "For more information, please visit https://docs.webiny.com/docs/tutorials/install-webiny#prerequisites."
                ].join(" ")
            )
        );
        process.exit(1);
    }

    try {
        const yarnVersion = await getYarnVersion();
        if (!semver.satisfies(yarnVersion, ">=1.22.0")) {
            console.error(
                chalk.red(
                    [
                        `Webiny requires yarn@^1.22.0 or higher.`,
                        `Please visit https://yarnpkg.com/ to install ${chalk.green("yarn")}.`
                    ].join("\n")
                )
            );
            process.exit(1);
        }
    } catch (err) {
        console.error(
            chalk.red(`Webiny depends on "yarn" and its built-in support for workspaces.`)
        );

        console.log(`Please visit https://yarnpkg.com/ to install ${chalk.green("yarn")}.`);

        process.exit(1);
    }

    await verifyConfig();
    require("./index");
})();
