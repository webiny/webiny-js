import { Entity, Table } from "dynamodb-toolbox";

export interface CreateRenderEntityParams {
    table: Table;
    entityName: string;
}

export const createRenderEntity = (params: CreateRenderEntityParams): Entity<any> => {
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
            GSI1_PK: {
                type: "string"
            },
            GSI1_SK: {
                type: "string"
            },
            data: {
                type: "map"
            }
        }
    });
};
