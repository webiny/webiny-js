import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export const defineSettingsEntity = (params: { context: PbContext; table: Table }): Entity<any> => {
    const { context, table } = params;
    const entityName = "PbSettings";
    const attributes = getExtraAttributes(context, entityName);
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
            ...attributes
        }
    });
};
