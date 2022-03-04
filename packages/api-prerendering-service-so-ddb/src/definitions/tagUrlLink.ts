import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

interface CreateTagUrlLinkEntityParams {
    table: Table;
    entityName: string;
    attributes: Attributes;
}

export const createTagUrlLinkEntity = (params: CreateTagUrlLinkEntityParams) => {
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
            },
            ...(attributes || {})
        }
    });
};
