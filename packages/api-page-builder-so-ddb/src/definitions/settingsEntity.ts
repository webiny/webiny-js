import { Entity, Table } from "dynamodb-toolbox";
import { Attributes } from "~/types";

export interface Params {
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
            name: {
                type: "string"
            },
            websiteUrl: {
                type: "string"
            },
            websitePreviewUrl: {
                type: "string"
            },
            favicon: {
                type: "map"
            },
            logo: {
                type: "map"
            },
            prerendering: {
                type: "map"
            },
            social: {
                type: "map"
            },
            pages: {
                type: "map"
            },
            type: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            TYPE: {
                type: "string"
            },
            // theme: {
            //     type: "string"
            // },
            ...(attributes || {})
        }
    });
};
