#!/usr/bin/env node
process.env.NODE_PATH = process.cwd();
const tsNode = require("ts-node");

tsNode.register({
    dir: process.cwd()
});

const { buildPackages } = require("./buildPackages");

(async () => {
    await buildPackages();
    process.exit();
})();
