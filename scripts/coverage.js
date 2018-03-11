#!/usr/bin/env node
const execa = require("execa");
const { argv } = require("yargs");

const config = [];
const pkg = argv._[0];

if (!pkg) {
    config.push("packages-*/**/tests/**/*.test.js");
} else {
    if (pkg.startsWith("packages-")) {
        config.push(pkg);
    } else if (pkg.includes("/tests/")) {
        config.push("packages-*/" + pkg);
    } else {
        config.push("packages-*/" + pkg + "/tests/**/*.test.js");
    }
}

const params = [
    "--reporter",
    argv.reporter || "text",
    ...(pkg ? ["--include", "packages-*/" + pkg + "/src"] : []),
    "mocha",
    "--require",
    "source-map-support/register",
    "--require",
    "babel-register",
    ...config
];

execa("nyc", params, { stdio: "inherit" }).catch(e => {
    console.log(e);
    process.exit(1);
});
