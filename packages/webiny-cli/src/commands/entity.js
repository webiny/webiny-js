// @flow
const fs = require("fs-extra");
const entity = require("./entity/entity");
const table = require("./entity/table");
const cli = require("./../cli");

exports.command = "entity <name>";
exports.describe = "Create a new entity.";
exports.builder = (yargs: Object) => {
    return yargs.positional("name", {
        describe: "Name of entity.",
        type: "string"
    });
};

exports.handler = function(argv: Object) {
    const name = argv.name.charAt(0).toUpperCase() + argv.name.slice(1);
    cli.validateName(name);

    const paths = {
        entity: cli.directory.api + "/src/app/entities/" + name + ".entity.js",
        table: cli.directory.api + "/src/app/tables/" + name + ".mysql.js"
    };

    fs.outputFileSync(paths.entity, entity(name));
    fs.outputFileSync(paths.table, table(name));

    cli.success(`Success!`);
    cli.info(`The following files were created:`);
    cli.info(`- ${paths.entity}`);
    cli.info(`- ${paths.table}`);
};
