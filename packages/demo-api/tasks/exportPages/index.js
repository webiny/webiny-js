#!/usr/bin/env node
// @flowIgnore
// eslint-disable
require("dotenv").config();
const path = require("path");

require("@babel/register")({
    configFile: path.resolve(__dirname + "/../../../../babel.config.js"),
    only: [/packages/]
});

require("./exportPages.js")
    .default()
    .then(() => {
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
