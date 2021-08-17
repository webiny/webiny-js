import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export const definePageElementEntity = (params: {
    context: PbContext;
    table: Table;
}): Entity<any> => {
    const { context, table } = params;
    const entityName = "PbPageElement";
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
            id: {
                type: "string"
            },
            name: {
                type: "string"
            },
            type: {
                type: "string"
            },
            category: {
                type: "string"
            },
            content: {
                type: "map"
            },
            preview: {
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
