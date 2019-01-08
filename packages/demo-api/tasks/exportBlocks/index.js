#!/usr/bin/env node
// @flowIgnore
// eslint-disable
const path = require("path");

require("@babel/register")({
    configFile: path.resolve(__dirname + "/../../../../babel.config.js"),
    only: [/packages/]
});

require("./exportBlocks.js")
    .default()
    .then(() => {
        process.exit(0);
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
