import { Entity, Table } from "dynamodb-toolbox";

export interface CreateRenderEntityParams {
    table: Table;
    entityName: string;
}

export const createRenderLegacyEntity = (params: CreateRenderEntityParams): Entity<any> => {
    const { entityName, table } = params;
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
            namespace: {
                type: "string"
            },
            url: {
                type: "string"
            },
            args: {
                type: "map"
            },
            configuration: {
                type: "map"
            },
            files: {
                type: "list"
            }
        }
    });
};
