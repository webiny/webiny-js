import type { Knex } from "knex";
import type { IColumnDefinition } from "~/features/fieldTypeMapper/abstractions.js";

export const addColumn = (
    table: Knex.CreateTableBuilder | Knex.AlterTableBuilder,
    name: string,
    type: string,
    nullable: boolean
): Knex.ColumnBuilder => {
    let column: Knex.ColumnBuilder;

    switch (type) {
        case "varchar":
            column = table.string(name);
            break;
        case "integer":
            column = table.integer(name);
            break;
        case "bigint":
            column = table.bigInteger(name);
            break;
        case "float":
            column = table.float(name);
            break;
        case "boolean":
            column = table.boolean(name);
            break;
        case "text":
        case "timestamp":
        case "date":
        case "json":
        case "jsonb":
        default:
            column = table.text(name);
            break;
    }

    if (nullable) {
        column.nullable();
    } else {
        column.notNullable();
    }

    return column;
};

export const applyColumnDefinitions = (
    table: Knex.CreateTableBuilder,
    columns: IColumnDefinition[]
): void => {
    for (const col of columns) {
        const column = addColumn(table, col.name, col.type, col.nullable ?? true);

        if (col.primaryKey) {
            column.primary();
        }

        if (col.defaultValue !== undefined) {
            column.defaultTo(col.defaultValue);
        }
    }
};
