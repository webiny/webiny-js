import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

interface Params {
    table: Table;
    entityName: string;
    attributes: Attributes;
}

export const createSettingsEntity = (params: Params): Entity<any> => {
    const { entityName, table, attributes } = params;
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
            key: {
                type: "string"
            },
            uploadMinFileSize: {
                type: "number"
            },
            uploadMaxFileSize: {
                type: "number"
            },
            srcPrefix: {
                type: "string"
            },
            contentModelLastChange: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            ...(attributes || {})
        }
    });
};
