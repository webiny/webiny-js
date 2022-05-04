import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { FileManagerContext } from "~/types";

export interface SystemEntityParams {
    context: FileManagerContext;
    table: Table;
}
export default (params: SystemEntityParams): Entity<any> => {
    const { context, table } = params;
    const entityName = "System";
    const attributes = getExtraAttributes(context, entityName);
    return new Entity({
        name: entityName,
        table,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
                sortKey: true
            },
            version: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            ...attributes
        }
    });
};
