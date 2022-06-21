import { Entity, Table } from "dynamodb-toolbox";

interface CreateTagPathLinkEntityParams {
    table: Table;
    entityName: string;
}

export const createTagPathLinkLegacyEntity = (params: CreateTagPathLinkEntityParams) => {
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
            value: {
                type: "string"
            },
            key: {
                type: "string"
            }
        }
    });
};
