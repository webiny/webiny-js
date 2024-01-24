import { Entity, Table } from "@webiny/db-dynamodb/toolbox";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
}

export const createEntry = (params: Params): Entity<any> => {
    const { table, entityName } = params;
    return new Entity({
        name: entityName,
        table,
        attributes: {
            PK: {
                type: "string",
                partitionKey: true
            },
            SK: {
                type: "string",
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
