import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export const definePageEntity = (params: { context: PbContext; table: Table }): Entity<any> => {
    const { context, table } = params;
    const entityName = "PbPage";
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
            pid: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            locale: {
                type: "string"
            },
            title: {
                type: "string"
            },
            editor: {
                type: "string"
            },
            createdFrom: {
                type: "string"
            },
            path: {
                type: "string"
            },
            category: {
                type: "string"
            },
            content: {
                type: "map"
            },
            publishedOn: {
                type: "string"
            },
            version: {
                type: "string"
            },
            settings: {
                type: "map"
            },
            locked: {
                type: "boolean"
            },
            status: {
                type: "string"
            },
            visibility: {
                type: "map"
            },
            home: {
                type: "boolean"
            },
            notFound: {
                type: "boolean"
            },
            createdOn: {
                type: "string"
            },
            savedOn: {
                type: "string"
            },
            createdBy: {
                type: "map"
            },
            ownedBy: {
                type: "map"
            },
            webinyVersion: {
                type: "string"
            },
            ...attributes
        }
    });
};
