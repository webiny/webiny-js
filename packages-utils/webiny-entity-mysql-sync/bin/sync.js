#!/usr/bin/env node
const program = require("commander");
const sync = require("..");

program
    .version(sync.version)
    .description("MySQL Entity Sync tool is made for syncing entities with MySQL database.")
    .option("-p, --path [path]", "Set path of entities")
    .option("-f, --format [format]", "Set format of files")
    .parse(process.argv);

sync.execute({
    path: program.path,
    format: program.format || "json"
});
