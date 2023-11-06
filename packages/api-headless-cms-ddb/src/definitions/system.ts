import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
    attributes: Attributes;
}

export const createSystemEntity = (params: Params): Entity<any> => {
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
            version: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            readAPIKey: {
                type: "string"
            },
            ...(attributes || {})
        }
    });
};
