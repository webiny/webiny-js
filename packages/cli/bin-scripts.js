#!/usr/bin/env node
"use strict";

const chalk = require("chalk");
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

    require("./scripts");
})();
