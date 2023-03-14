import { Entity, Table } from "dynamodb-toolbox";
import { EntityAttributes } from "dynamodb-toolbox/dist/classes/Entity";

export const createLegacyEntity = (
    table: Table,
    entityName: string,
    attributes: EntityAttributes
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
    });
};

export const createStandardEntity = (
    table: Table,
    entityName: string,
    attributes: EntityAttributes = {}
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
    });
};
