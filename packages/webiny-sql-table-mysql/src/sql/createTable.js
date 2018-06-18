// @flow
import type { Table } from "webiny-sql-table";
import type Column from "./../columns/column";
import type KeyIndex from "./../indexes/keyIndex";

export default (table: Table): string => {
    const columns = [];
    table.getColumns().forEach(column => {
        const mysqlColumn = ((column: any): Column);
        columns.push(mysqlColumn.getSQLValue());
    });

    const indexes = [];
    table.getIndexes().forEach(index => {
        const mysqlIndex = ((index: any): KeyIndex);
        indexes.push(mysqlIndex.getSQLValue());
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
