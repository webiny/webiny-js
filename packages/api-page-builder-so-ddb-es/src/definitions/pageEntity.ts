import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

export interface Params {
    table: Table;
    entityName: string;
    attributes: Attributes;
}

export const createPageEntity = (params: Params): Entity<any> => {
    const { entityName, attributes, table } = params;
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
            pid: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            title: {
                type: "string"
            },
            editor: {
                type: "string"
            },
            createdFrom: {
                type: "string"
            },
            path: {
                type: "string"
            },
            category: {
                type: "string"
            },
            content: {
                type: "map"
            },
            publishedOn: {
                type: "string"
            },
            version: {
                type: "number"
            },
            settings: {
                type: "map"
            },
            locked: {
                type: "boolean"
            },
            status: {
                type: "string"
            },
            visibility: {
                type: "map"
            },
            home: {
                type: "boolean"
            },
            notFound: {
                type: "boolean"
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
            ownedBy: {
                type: "map"
            },
            webinyVersion: {
                type: "string"
            },
            ...(attributes || {})
        }
    });
};
