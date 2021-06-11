import { Entity, Table } from "dynamodb-toolbox";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export default (params: { context: FileManagerContext; table: Table }): Entity<any> => {
    const { table } = params;
    return new Entity({
        name: "Settings",
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
            }
        }
    });
};
