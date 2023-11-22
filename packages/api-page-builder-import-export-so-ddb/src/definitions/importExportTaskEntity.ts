import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { Attributes } from "~/types";

interface Params {
    entityName: string;
    table: Table<string, string, string>;
    attributes?: Attributes;
}

export const createImportExportTaskEntity = ({ entityName, table, attributes }: Params) => {
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
            GSI1_PK: {
                type: "string"
            },
            GSI1_SK: {
                type: "string"
            },
            TYPE: {
                type: "string"
            },
            id: {
                type: "string"
            },
            parent: {
                type: "string"
            },
            status: {
                type: "string"
            },
            data: {
                type: "map"
            },
            input: {
                type: "map"
            },
            stats: {
                type: "map"
            },
            error: {
                type: "map"
            },
            createdOn: {
                type: "string"
            },
            createdBy: {
                type: "map"
            },
            tenant: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            ...attributes
        }
    });
};
