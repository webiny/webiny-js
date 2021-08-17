import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export const defineCategoryEntity = (params: { context: PbContext; table: Table }): Entity<any> => {
    const { context, table } = params;
    const entityName = "PbCategory";
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
            slug: {
                type: "string"
            },
            url: {
                type: "string"
            },
            layout: {
                type: "string"
            },
            createdOn: {
                type: "string"
            },
            createdBy: {
                type: "map"
            },
            tenant: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            ...attributes
        }
    });
};
