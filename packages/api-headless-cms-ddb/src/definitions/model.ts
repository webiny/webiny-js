import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { Attributes } from "~/types";

interface Params {
    table: Table<string, string, string>;
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
                type: "string",
                required: true
            },
            webinyVersion: {
                type: "string",
                required: true
            },
            name: {
                type: "string",
                required: true
            },
            modelId: {
                type: "string",
                required: true
            },
            singularApiName: {
                type: "string",
                required: true
            },
            pluralApiName: {
                type: "string",
                required: true
            },
            locale: {
                type: "string",
                required: true
            },
            group: {
                type: "map",
                required: true
            },
            icon: {
                type: "map"
            },
            description: {
                type: "string"
            },
            createdOn: {
                type: "string",
                required: true
            },
            savedOn: {
                type: "string",
                required: true
            },
            createdBy: {
                type: "map",
                required: true
            },
            fields: {
                type: "list",
                required: true
            },
            layout: {
                type: "list",
                required: true
            },
            tags: {
                type: "list",
                required: false,
                default: []
            },
            lockedFields: {
                type: "list",
                required: true
            },
            titleFieldId: {
                type: "string"
            },
            descriptionFieldId: {
                type: "string"
            },
            imageFieldId: {
                type: "string"
            },
            tenant: {
                type: "string",
                required: true
            },
            ...(attributes || {})
        }
    });
};
