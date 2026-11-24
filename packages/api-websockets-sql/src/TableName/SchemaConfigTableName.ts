import { SqlSchemaConfig } from "@webiny/api-core-sql";
import { TableName as TableNameAbstraction } from "~/TableName/abstractions.js";
import { TableName } from "~/TableName/TableName.js";

/** Table names with the prefix of the SQL storage in the container (`SqlSchemaConfig`). */
class SchemaConfigTableNameImpl implements TableNameAbstraction.Interface {
    private readonly tableName: TableName;

    public constructor(schemaConfig?: SqlSchemaConfig.Interface) {
        this.tableName = new TableName(schemaConfig?.tableNamePrefix);
    }

    public resolve(name: string): string {
        return this.tableName.resolve(name);
    }
}

export const SchemaConfigTableName = TableNameAbstraction.createImplementation({
    implementation: SchemaConfigTableNameImpl,
    dependencies: [[SqlSchemaConfig, { optional: true }]]
});
