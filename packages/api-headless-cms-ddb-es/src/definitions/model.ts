import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

export interface Params {
    table: Table;
    entityName: string;
    attributes: Attributes;
}

export const createModelEntity = (params: Params): Entity<any> => {
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
            name: {
                type: "string"
            },
            modelId: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            group: {
                type: "map"
            },
            description: {
                type: "string"
            },
            createdOn: {
                type: "string"
            },
            savedOn: {
                type: "string"
            },
            createdBy: {
                type: "map"
            },
            fields: {
                type: "list"
            },
            layout: {
                type: "list"
            },
            lockedFields: {
                type: "list"
            },
            titleFieldId: {
                type: "string"
            },
            ...(attributes || {})
        }
    });
};
