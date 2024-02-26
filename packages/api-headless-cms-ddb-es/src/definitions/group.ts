import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { Attributes } from "~/types";

export interface CreateGroupEntityParams {
    table: Table<string, string, string>;
    entityName: string;
    attributes: Attributes;
}
export const createGroupEntity = (params: CreateGroupEntityParams): Entity<any> => {
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
            webinyVersion: {
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
            locale: {
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
