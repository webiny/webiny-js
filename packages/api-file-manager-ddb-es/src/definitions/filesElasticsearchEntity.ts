import { Entity, Table } from "dynamodb-toolbox";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export default (params: { context: FileManagerContext; table: Table }): Entity<any> => {
    const { table } = params;
    return new Entity({
        name: "FilesElasticsearch",
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
            }
        }
    });
};
