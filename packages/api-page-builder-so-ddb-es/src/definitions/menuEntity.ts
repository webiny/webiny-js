import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export const defineMenuEntity = (params: { context: PbContext; table: Table }): Entity<any> => {
    const { context, table } = params;
    const entityName = "PbMenu";
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
            TYPE: {
                type: "string"
            },
            title: {
                type: "string"
            },
            slug: {
                type: "string"
            },
            description: {
                type: "string"
            },
            items: {
                type: "map"
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
