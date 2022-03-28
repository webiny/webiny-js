#!/usr/bin/env node
process.env.NODE_PATH = process.cwd();

require("ts-node").register({
    dir: process.cwd()
});

const { runCli } = require("./cli");
(async () => {
    await runCli();
    process.exit();
})();
