import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

export interface Params {
    table: Table;
    entityName: string;
    attributes: Attributes;
}

export const createPageElasticsearchEntity = (params: Params): Entity<any> => {
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
            index: {
                type: "string"
            },
            data: {
                type: "map"
            },
            ...(attributes || {})
        }
    });
};
