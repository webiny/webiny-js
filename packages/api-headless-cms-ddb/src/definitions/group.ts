import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { Entity } from "@webiny/db-dynamodb/toolbox.js";
import type { Attributes } from "~/types.js";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
    attributes: Attributes;
}
export const createGroupEntity = (params: Params): Entity<any> => {
    const { table, attributes, entityName } = params;
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
            name: {
                type: "string"
            },
            slug: {
                type: "string"
            },
            description: {
                type: "string"
            },
            icon: {
                type: "string"
            },

            createdBy: {
                type: "map"
            },
            createdOn: {
                type: "string"
            },
            savedOn: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            ...(attributes || {})
        }
    });
};
