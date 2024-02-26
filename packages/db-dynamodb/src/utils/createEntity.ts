import { AttributeDefinitions, Entity, Table } from "~/toolbox";

interface CreateStandardEntityParams {
    table: Table<string, string, string>;
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
    table: Table<string, string, string>;
    name: string;
    attributes?: AttributeDefinitions;
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
