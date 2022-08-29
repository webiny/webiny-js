import { Entity, Table } from "dynamodb-toolbox";
import { Attributes, ENTITIES } from "../types";

const createEntity = (entityName: string, table: Table, attributes: Attributes) => {
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
            GSI1_PK: {
                type: "string"
            },
            GSI1_SK: {
                type: "string"
            },
            TYPE: {
                type: "string"
            },
            ...(attributes || {})
        }
    });
};

export const createFolderEntity = (table: Table, attributes: Attributes = {}) => {
    return createEntity(ENTITIES.FOLDER, table, {
        id: {
            type: "string"
        },
        name: {
            type: "string"
        },
        slug: {
            type: "string"
        },
        category: {
            type: "string"
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
        webinyVersion: {
            type: "string"
        },
        ...attributes
    });
};
