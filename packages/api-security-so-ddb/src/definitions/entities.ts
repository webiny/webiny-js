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

export const createGroupEntity = (table, attributes = {}) => {
    return createEntity(ENTITIES.GROUP, table, {
        id: {
            type: "string"
        },
        tenant: {
            type: "string"
        },
        system: {
            type: "boolean"
        },
        createdBy: {
            type: "map"
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
        description: {
            type: "string"
        },
        permissions: {
            type: "list"
        },
        webinyVersion: {
            type: "string"
        },
        ...attributes
    });
};

export const createApiKeyEntity = (table, attributes = {}) => {
    return createEntity(ENTITIES.API_KEY, table, {
        id: {
            type: "string"
        },
        token: {
            type: "string"
        },
        tenant: {
            type: "string"
        },
        createdBy: {
            type: "map"
        },
        createdOn: {
            type: "string"
        },
        name: {
            type: "string"
        },
        description: {
            type: "string"
        },
        permissions: {
            type: "list"
        },
        webinyVersion: {
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

export const createTenantLinkEntity = (table, attributes = {}) => {
    return createEntity(ENTITIES.TENANT_LINK, table, {
        createdOn: {
            type: "string"
        },
        identity: {
            type: "string"
        },
        tenant: {
            type: "string"
        },
        type: {
            type: "string"
        },
        data: {
            type: "map"
        },
        webinyVersion: {
            type: "string"
        },
        ...attributes
    });
};
