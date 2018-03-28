"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = table => {
    const columns = [];
    table.getColumns().forEach(column => {
        columns.push(column.getSQLValue());
    });

    const indexes = [];
    table.getIndexes().forEach(index => {
        indexes.push(index.getSQLValue());
    });

    let output = columns
        .concat(indexes)
        .map(item => `\t${item}`)
        .join(",\n");
    output = `CREATE TABLE \`${table.getName()}\` (\n` + output;

    output += `\n)`;

    // Table options.
    if (table.getEngine()) {
        output += ` ENGINE=${table.getEngine()}`;
    }

    if (table.getAutoIncrement()) {
        output += ` AUTO_INCREMENT=${table.getAutoIncrement()}`;
    }

    if (table.getDefaultCharset()) {
        output += ` DEFAULT CHARSET=${table.getDefaultCharset()}`;
    }

    if (table.getCollate()) {
        output += ` COLLATE=${table.getCollate()}`;
    }

    if (table.getComment()) {
        output += ` COMMENT='${table.getComment()}'`;
    }

    return output + ";";
};
//# sourceMappingURL=createTable.js.map
