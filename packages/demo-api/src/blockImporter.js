#!/usr/bin/env node
// @flow
// eslint-disable
const argv = require("yargs").argv;
const path = require("path");

require("@babel/register")({
    configFile: path.resolve(__dirname + "/../../../babel.config.js"),
    only: [/packages/]
});

require("./blockImporter/blockImporter")
    .default(argv._)
    .then(() => {
        console.log("Done!");
        process.exit(0);
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
