#!/usr/bin/env node
process.env.NODE_PATH = process.cwd();
const Module = require("module");
const timeStart = process.hrtime();

require("ts-node").register();
const { runCli } = require("./cli.ts");
(async () => {
    console.log("Run CLI...");
    runCli().then(() => {
        const timeEnd = process.hrtime(timeStart);
        const cache = Object.keys(Module._cache);

        function countModules(str) {
            return cache.reduce((count, path) => (path.includes(str) ? count + 1 : count), 0);
        }

        // console.log("\n===== STATS =====");
        // console.log("Required", cache.length, "modules");
        // console.log("Executed in", timeEnd[0] + timeEnd[1] / Math.pow(10, 9), "seconds");
        // const used = Math.ceil(process.memoryUsage().heapUsed / 1024 / 1024);
        // console.log(`Used approximately`, used, "MB");
        // console.log(`React modules`, countModules("react/"));
        // console.log(`Pulumi modules`, countModules("pulumi/"));
    });
})();
