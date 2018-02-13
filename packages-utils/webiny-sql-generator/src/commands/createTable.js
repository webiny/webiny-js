import Query from "./query";
import _ from "lodash";

class CreateTable extends Query {
    generate() {
        const options = this.options;
        let operation = `CREATE TABLE \`${options.name}\` (`;

        const columns = Object.keys(this.options.columns);
        columns.forEach(name => {
            const column = this.options.columns[name];

            operation += `\n\t\`${name}\` ${column.type}`;

            if (column.params) {
                operation += `(${column.params.join(", ")})`;
            } else if (column.length) {
                operation += `(${column.length})`;
            }

            if (column.unsigned === true) {
                operation += " unsigned";
            }

            if (column.notNull === true) {
                operation += " NOT NULL";
            }

            if ("default" in column) {
                operation += ` DEFAULT '${column.default}'`;
            }

            if (column.autoIncrement) {
                operation += ` AUTO_INCREMENT`;
            }

            // If last row, don't append comma at the end.
            operation += ",";
        });

        if (this.options.indexes) {
            const indexes = Object.keys(this.options.indexes);
            indexes.forEach(name => {
                const index = this.options.indexes[name];

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
                if (columns) {
                    columns = columns.join(", ");
                } else if (index.column) {
                    columns = index.column;
                } else {
                    columns = name;
                }

                operation += `\n\t${type}`;
                if (type) {
                    operation += " ";
                }
                operation += `KEY ${type === "PRIMARY" ? "" : name} (\`${columns}\`)`;

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
