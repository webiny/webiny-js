import { Entity, Table } from "dynamodb-toolbox";
import { Attributes, ENTITIES } from "~/types";

const createEntity = (entityName: string, table: Table, attributes: Attributes): Entity<any> => {
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

export const createUserEntity = (table, attributes = {}) => {
    return createEntity(ENTITIES.USERS, table, {
        id: {
            type: "string"
        },
        tenant: {
            type: "string"
        },
        email: {
            type: "string"
        },
        firstName: {
            type: "string"
        },
        lastName: {
            type: "string"
        },
        avatar: {
            type: "map"
        },
        createdBy: {
            type: "map"
        },
        createdOn: {
            type: "string"
        },
        group: {
            type: "string"
        },
        ...attributes
    });
};

export const createSystemEntity = (table, attributes = {}) => {
    return createEntity(ENTITIES.SYSTEM, table, {
        tenant: {
            type: "string"
        },
        version: {
            type: "string"
        },
        ...attributes
    });
};
