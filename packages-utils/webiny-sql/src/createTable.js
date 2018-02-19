import Statement from "./statement";
import _ from "lodash";

class CreateTable extends Statement {
    generate() {
        const options = this.options;
        let operation = `CREATE TABLE \`${options.name}\` (`;

        if (Array.isArray(this.options.columns)) {
            this.options.columns.forEach(column => {
                operation += `\n\t\`${column.name}\` ${column.type}`;

                if (column.params) {
                    operation += `(${column.params.join(", ")})`;
                } else if (column.size) {
                    operation += `(${column.size})`;
                }

                if (column.unsigned === true) {
                    operation += " unsigned";
                }

                if (column.notNull === true) {
                    operation += " NOT NULL";
                }

                if (typeof column.default !== "undefined") {
                    if (column.default === null) {
                        operation += ` DEFAULT NULL`;
                    } else {
                        operation += ` DEFAULT '${column.default}'`;
                    }
                }

                if (column.autoIncrement) {
                    operation += ` AUTO_INCREMENT`;
                }

                // If last row, don't append comma at the end.
                operation += ",";
            });
        }

        if (Array.isArray(this.options.indexes)) {
            this.options.indexes.forEach(index => {
                let type = "";
                if (index.type) {
                    type = index.type.toUpperCase();
                    switch (type) {
                        case "UNIQUE":
                        case "FULLTEXT":
                        case "PRIMARY":
                            break;
                        default:
                            type = "";
                            break;
                    }
                }

                let columns = index.columns;
                if (Array.isArray(columns) && columns.length) {
                    columns = columns.map(item => `\`${item}\``).join(", ");
                } else if (index.column) {
                    columns = `\`${index.column}\``;
                } else {
                    columns = `\`${index.name}\``;
                }

                operation += `\n\t${type}`;
                if (type) {
                    operation += " ";
                }
                operation += `KEY ${type === "PRIMARY" ? "" : index.name} (${columns})`;

                operation += `,`;
            });
        }

        operation = _.trimEnd(operation, ",");

        operation += `\n)`;

        if (options.engine) {
            operation += ` ENGINE=${options.engine}`;
        }

        if (options.autoIncrement) {
            operation += ` AUTO_INCREMENT=${options.autoIncrement}`;
        }

        if (options.defaultCharset) {
            operation += ` DEFAULT CHARSET=${options.defaultCharset}`;
        }

        if (options.collate) {
            operation += ` COLLATE=${options.collate}`;
        }

        if (options.comment) {
            operation += ` COMMENT="${options.comment}"`;
        }

        return operation;
    }
}

export default CreateTable;
