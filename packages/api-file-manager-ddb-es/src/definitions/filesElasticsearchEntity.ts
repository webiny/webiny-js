import { Entity, Table } from "dynamodb-toolbox";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";

export interface FileElasticsearchEntityParams {
    context: FileManagerContext;
    table: Table;
}
export default (params: FileElasticsearchEntityParams): Entity<any> => {
    const { context, table } = params;
    const entityName = "FilesElasticsearch";
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
            index: {
                type: "string"
            },
            data: {
                type: "map"
            },
            ...attributes
        }
    });
};
