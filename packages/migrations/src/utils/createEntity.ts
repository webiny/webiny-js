import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { AttributeDefinitions } from "@webiny/db-dynamodb/toolbox";

export const createLegacyEntity = (
    table: Table<string, string, string>,
    entityName: string,
    attributes: AttributeDefinitions
) => {
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
    }) as Entity & { table: Table<string, string, string> };
};

export const createStandardEntity = (
    table: Table<string, string, string>,
    entityName: string,
    attributes: AttributeDefinitions = {}
) => {
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
            data: {
                type: "map"
            },
            // When moving attributes to `data` envelope, we need to keep the old attributes in place for 1 version.
            ...attributes
        }
    }) as Entity & { table: Table<string, string, string> };
};
