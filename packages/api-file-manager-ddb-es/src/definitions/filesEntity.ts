import { Entity, Table } from "dynamodb-toolbox";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { getExtraAttributes } from "@webiny/db-dynamodb/attributes";

export default (params: { context: FileManagerContext; table: Table }): Entity<any> => {
    const { context, table } = params;
    const entityName = "Files";
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
            id: {
                type: "string"
            },
            key: {
                type: "string"
            },
            size: {
                type: "number"
            },
            type: {
                type: "string"
            },
            name: {
                type: "string"
            },
            meta: {
                type: "map"
            },
            tags: {
                type: "list"
            },
            createdOn: {
                type: "string"
            },
            createdBy: {
                type: "map"
            },
            tenant: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            webinyVersion: {
                type: "string"
            },
            ...getExtraAttributes(context, entityName)
        }
    });
};
