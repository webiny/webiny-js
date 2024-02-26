import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { Attributes } from "~/types";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
    attributes: Attributes;
}

export const createSubmissionEntity = (params: Params): Entity<any> => {
    const { table, entityName, attributes } = params;
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
            id: {
                type: "string"
            },
            TYPE: {
                type: "string"
            },
            data: {
                type: "map"
            },
            meta: {
                type: "map"
            },
            form: {
                type: "map"
            },
            logs: {
                type: "list"
            },
            createdOn: {
                type: "string"
            },
            savedOn: {
                type: "string"
            },
            ownedBy: {
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
            ...(attributes || {})
        }
    });
};
