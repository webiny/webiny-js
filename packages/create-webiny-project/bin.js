#!/usr/bin/env node
"use strict";

const semver = require("semver");
const chalk = require("chalk");
const getYarnVersion = require("./utils/getYarnVersion");
const getNpmVersion = require("./utils/getNpmVersion");
const verifyConfig = require("./utils/verifyConfig");

(async () => {
    const minNodeVersion = "16";
    const minNpmVersion = "10";
    const minYarnVersion = "1.22.21";
    /**
     * Node
     */
    const nodeVersion = process.versions.node;
    if (!semver.satisfies(nodeVersion, `>=${minNodeVersion}`)) {
        console.error(
            chalk.red(
                [
                    `You are running Node.js ${nodeVersion}, but Webiny requires version ${minNodeVersion} or higher.`,
                    `Please switch to one of the required versions and try again.`,
                    "For more information, please visit https://docs.webiny.com/docs/tutorials/install-webiny#prerequisites."
                ].join(" ")
            )
        );
        process.exit(1);
    }
    /**
     * npm
     */
    try {
        const npmVersion = await getNpmVersion();
        if (!semver.satisfies(npmVersion, `>=${minNpmVersion}`)) {
            console.error(
                chalk.red(
                    [
                        `Webiny requires npm@^${minNpmVersion} or higher.`,
                        `Please run ${chalk.green(
                            "npm install npm@latest -g"
                        )}, to get the latest version.`
                    ].join("\n")
                )
            );
            process.exit(1);
        }
    } catch (err) {
        console.error(chalk.red(`Webiny depends on "npm".`));

        console.log(
            `Please visit https://docs.npmjs.com/try-the-latest-stable-version-of-npm to install ${chalk.green(
                "npm"
            )}.`
        );

        process.exit(1);
    }

    /**
     * yarn
     */
    try {
        const yarnVersion = await getYarnVersion();
        if (!semver.satisfies(yarnVersion, `>=${minYarnVersion}`)) {
            console.error(
                chalk.red(
                    [
                        `Webiny requires yarn@^${minYarnVersion} or higher.`,
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
