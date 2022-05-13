import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { FileManagerContext } from "~/types";

export interface SettingsEntityElasticsearch {
    context: FileManagerContext;
    table: Table;
}
export default (params: SettingsEntityElasticsearch): Entity<any> => {
    const { context, table } = params;
    const entityName = "Settings";
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
            TYPE: {
                type: "string"
            },
            key: {
                type: "string"
            },
            uploadMinFileSize: {
                type: "number"
            },
            uploadMaxFileSize: {
                type: "number"
            },
            srcPrefix: {
                type: "string"
            },
            ...attributes
        }
    });
};
