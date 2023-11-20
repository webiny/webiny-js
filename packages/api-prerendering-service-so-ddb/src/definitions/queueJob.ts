import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { Attributes } from "~/types";

export interface CreateQueueJobEntityParams {
    table: Table<string, string, string>;
    entityName: string;
    attributes: Attributes;
}

export const createQueueJobEntity = (params: CreateQueueJobEntityParams): Entity<any> => {
    const { entityName, attributes, table } = params;
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
            args: {
                type: "map"
            },
            ...(attributes || {})
        }
    });
};
