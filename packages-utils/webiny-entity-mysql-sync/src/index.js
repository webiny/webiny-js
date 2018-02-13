#! /usr/bin/env node
const glob = require("glob");
const utils = require("./utils");

class Sync {
    constructor() {
        this.version = JSON.parse(utils.readFile(__dirname + "/../package.json")).version;
    }

    execute(options) {
        glob(options.path, function(er, files) {
            if (files.length < 1) {
                return "Nema.";
            }

            files.forEach(path => {
                switch (options.format) {
                    case "js":
                        break;
                    default: {
                        const table = JSON.parse(utils.readFile(path));
                        console.log(table);
                    }
                }
            });
        });

        /*CREATE TABLE `ic_kiosk` (
            `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            `name` varchar(100) DEFAULT '0',
            `status` enum('active','inactive') DEFAULT 'inactive',
            PRIMARY KEY (`id`),
    ) ENGINE=InnoDB*/
    }
}

const sync = new Sync();

module.exports = sync;
