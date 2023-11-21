import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { Attributes, ENTITIES } from "~/types";

const createEntity = (
    entityName: string,
    table: Table<string, string, string>,
    attributes: Attributes
): Entity<any> => {
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

export const createUserEntity = (table: Table<string, string, string>) => {
    return createEntity(ENTITIES.USERS, table, {
        data: {
            type: "map"
        }
    });
};

export const createSystemEntity = (
    table: Table<string, string, string>,
    attributes: Attributes = {}
) => {
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
