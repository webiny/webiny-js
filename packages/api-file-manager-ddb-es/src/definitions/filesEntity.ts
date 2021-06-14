import { Entity, Table } from "dynamodb-toolbox";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export default (params: { context: FileManagerContext; table: Table }): Entity<any> => {
    const { table } = params;
    return new Entity({
        name: "Files",
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
            }
        }
    });
};
