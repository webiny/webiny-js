import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

export interface Params {
    table: Table;
    entityName: string;
    attributes: Attributes;
}

export const createFormEntity = (params: Params): Entity<any> => {
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
            TYPE: {
                type: "string"
            },
            id: {
                type: "string"
            },
            formId: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            createdBy: {
                type: "map"
            },
            ownedBy: {
                type: "map"
            },
            savedOn: {
                type: "string"
            },
            createdOn: {
                type: "string"
            },
            name: {
                type: "string"
            },
            slug: {
                type: "string"
            },
            version: {
                type: "number"
            },
            locked: {
                type: "boolean"
            },
            published: {
                type: "boolean"
            },
            publishedOn: {
                type: "string"
            },
            status: {
                type: "string"
            },
            fields: {
                type: "map"
            },
            layout: {
                type: "list"
            },
            stats: {
                type: "map"
            },
            settings: {
                type: "map"
            },
            triggers: {
                type: "map"
            },
            ...(attributes || {})
        }
    });
};
