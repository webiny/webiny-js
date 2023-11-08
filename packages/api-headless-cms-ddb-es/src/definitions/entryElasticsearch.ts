import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { Attributes } from "~/types";

export interface CreateEntryElasticsearchEntityParams {
    table: Table<string, string, string>;
    entityName: string;
    attributes: Attributes;
}
export const createEntryElasticsearchEntity = (
    params: CreateEntryElasticsearchEntityParams
): Entity<any> => {
    const { table, entityName, attributes } = params;
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
            },
            ...(attributes || {})
        }
    });
};
