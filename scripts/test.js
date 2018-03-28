#!/usr/bin/env node
const execa = require("execa");
const { argv } = require("yargs");

const config = [];
const pkg = argv._[0];

if (!pkg) {
    config.push("packages/**/tests/**/*.test.js");
} else {
    if (pkg.startsWith("packages")) {
        config.push(pkg);
    } else if (pkg.includes("/tests/")) {
        config.push("packages/" + pkg);
    } else {
        config.push("packages/" + pkg + "/tests/**/*.test.js");
    }
}

const params = [
    ...config,
    "--require",
    "source-map-support/register",
    "--require",
    "babel-register"
];
execa("mocha", params, { stdio: "inherit" });
