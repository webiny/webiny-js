import { AttributeDefinitions, Entity, Table } from "@webiny/db-dynamodb/toolbox";

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
        },
        autoExecute: true,
        autoParse: true
    });
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
        },
        autoExecute: true,
        autoParse: true
    });
};
