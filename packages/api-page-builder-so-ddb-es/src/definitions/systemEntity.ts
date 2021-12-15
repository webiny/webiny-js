import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export const defineSystemEntity = (params: { context: PbContext; table: Table }): Entity<any> => {
    const { context, table } = params;
    const entityName = "PbSystem";
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
            version: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            ...attributes
        }
    });
};
