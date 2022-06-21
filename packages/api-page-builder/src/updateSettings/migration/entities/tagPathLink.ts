import { Entity, Table } from "dynamodb-toolbox";

interface CreateTagPathLinkEntityParams {
    table: Table;
    entityName: string;
}

export const createTagPathLinkEntity = (params: CreateTagPathLinkEntityParams) => {
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
