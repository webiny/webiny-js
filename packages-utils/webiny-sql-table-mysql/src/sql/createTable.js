export default table => {
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
    if (table.engine) {
        output += ` ENGINE=${table.engine}`;
    }

    if (table.autoIncrement) {
        output += ` AUTO_INCREMENT=${table.autoIncrement}`;
    }

    if (table.defaultCharset) {
        output += ` DEFAULT CHARSET=${table.defaultCharset}`;
    }

    if (table.collate) {
        output += ` COLLATE=${table.collate}`;
    }

    if (table.comment) {
        output += ` COMMENT='${table.comment}'`;
    }

    return output;
};
