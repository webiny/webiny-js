#! /usr/bin/env node
const glob = require("glob");
const fs = require("fs");
const sqlGenerator = require("webiny-sql-generator");

class Sync {
    constructor() {
        this.version = JSON.parse(this.__readFile(__dirname + "/../package.json")).version;
    }

    execute(options) {
        glob(options.path, function(er, files) {
            if (files.length < 1) {
                return "Nema.";
            }

            const output = [];

            files.forEach(path => {
                switch (options.format) {
                    case "js":
                        break;
                    default: {
                        const definition = JSON.parse(this.__readFile(path));
                        output.push({
                            name: definition.name,
                            sql: sqlGenerator.createTable(definition)
                        });
                    }
                }
            });
            console.log(output);
        });
    }

    __readFile(path) {
        return fs.readFileSync(path, "utf8");
    }
}

const sync = new Sync();

module.exports = sync;
