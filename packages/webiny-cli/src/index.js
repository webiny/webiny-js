#!/usr/bin/env node
"use strict";

var chalk = require("chalk");
var currentNodeVersion = process.versions.node;
var majorVersion = currentNodeVersion.split(".")[0];

if (majorVersion < 8) {
    console.error(
        chalk.red(
            "You are running Node " +
                currentNodeVersion +
                ".\n" +
                "Webiny requires Node 8 or higher. \n" +
                "Please update your version of Node."
        )
    );
    process.exit(1);
}

require("./cli");
