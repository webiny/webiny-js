import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

interface CreateTagPathLinkEntityParams {
    table: Table;
    entityName: string;
    attributes: Attributes;
}

export const createTagPathLinkEntity = (params: CreateTagPathLinkEntityParams) => {
    const { entityName, attributes, table } = params;
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
            },
            ...(attributes || {})
        }
    });
};
