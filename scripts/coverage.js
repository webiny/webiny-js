#!/usr/bin/env node
const execa = require("execa");
const { argv } = require("yargs");

let glob = "packages/**/tests/**/*.test.js";
const pkg = argv._[0];

if (pkg) {
    if (pkg.startsWith("packages")) {
        glob = pkg;
    } else if (pkg.includes("/tests/")) {
        glob = "packages/" + pkg;
    } else {
        glob = "packages/" + pkg + "/tests/**/*.test.js";
    }
}

const common = [
    ...(pkg ? ["--include", "packages/" + pkg + "/src"] : ["--include", "packages/**/src"]),
    "mocha",
    "--require",
    "source-map-support/register",
    "--require",
    "babel-register",
    glob
];

let params;

if (argv.check) {
    params = ["--check-coverage", "--branches=95", "--functions=98", "--lines=98", ...common];
} else {
    params = ["--reporter", argv.reporter || "text", ...common];
}

execa("nyc", params, { stdio: "inherit" });
