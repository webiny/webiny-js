import { Entity, Table } from "dynamodb-toolbox";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";

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
