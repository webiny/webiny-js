import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

export interface Params {
    table: Table;
    entityName: string;
    attributes: Attributes;
}

export const createRenderEntity = (params: Params): Entity<any> => {
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
            args: {
                type: "map"
            },
            configuration: {
                type: "map"
            },
            files: {
                type: "list"
            },
            ...(attributes || {})
        }
    });
};
