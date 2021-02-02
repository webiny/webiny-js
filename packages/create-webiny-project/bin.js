#!/usr/bin/env node
"use strict";

const chalk = require("chalk");
const execa = require("execa");
const semver = require("semver");
const verifyConfig = require("./utils/verifyConfig");

const currentNodeVersion = process.versions.node;
const majorVersion = parseInt(currentNodeVersion.split(".")[0]);
const minorVersion = parseInt(currentNodeVersion.split(".")[1]);

const NODE_VERSION_MIN_MAJOR = 10;
const NODE_VERSION_MIN_MINOR = 14;

(async () => {
    if (
        majorVersion < NODE_VERSION_MIN_MAJOR ||
        (majorVersion === NODE_VERSION_MIN_MAJOR && minorVersion < NODE_VERSION_MIN_MINOR)
    ) {
        console.error(
            chalk.red(
                "You are running Node " +
                    currentNodeVersion +
                    ".\n" +
                    `Webiny requires Node ${NODE_VERSION_MIN_MAJOR}.${NODE_VERSION_MIN_MINOR} or higher. \n` +
                    "Please update your version of Node."
            )
        );
        process.exit(1);
    }

    try {
        await execa("yarn", ["--version"]);
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
