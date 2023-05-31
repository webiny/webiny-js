import { Entity, Table } from "dynamodb-toolbox";
import { EntityAttributes } from "dynamodb-toolbox/dist/classes/Entity";

interface CreateStandardEntityParams {
    table: Table;
    name: string;
}

export const createStandardEntity = (params: CreateStandardEntityParams): Entity<any> => {
    return new Entity({
        name: params.name,
        table: params.table,
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
            }
        }
    });
};

interface CreateLegacyEntityParams {
    table: Table;
    name: string;
    attributes?: EntityAttributes;
}

export const createLegacyEntity = (params: CreateLegacyEntityParams) => {
    return new Entity({
        table: params.table,
        name: params.name,
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
            ...(params.attributes || {})
        }
    });
};
