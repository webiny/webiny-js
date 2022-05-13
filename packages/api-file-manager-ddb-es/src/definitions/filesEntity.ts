import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { FileManagerContext } from "~/types";

export interface FilesEntityParams {
    context: FileManagerContext;
    table: Table;
}
export default (params: FilesEntityParams): Entity<any> => {
    const { context, table } = params;
    const entityName = "Files";
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
            ...attributes
        }
    });
};
