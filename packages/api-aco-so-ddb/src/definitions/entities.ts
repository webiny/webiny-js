import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

export const createEntity = (entityName: string, table: Table, attributes: Attributes) => {
    return new Entity({
        table,
        name: entityName,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
                sortKey: true
            },
            GSI1_PK: {
                type: "string"
            },
            GSI1_SK: {
                type: "string"
            },
            TYPE: {
                type: "string"
            },
            data: {
                type: "map"
            },
            ...(attributes || {})
        }
    });
};
