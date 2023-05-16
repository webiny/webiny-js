#!/usr/bin/env node
process.env.NODE_PATH = process.cwd();
const tsNode = require("ts-node");

tsNode.register({
    dir: process.cwd()
});

const { prepublishOnly } = require("./prepublishOnly");

(async () => {
    await prepublishOnly();
    process.exit();
})();
