import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export const definePageElasticsearchEntity = (params: {
    context: PbContext;
    table: Table;
}): Entity<any> => {
    const { context, table } = params;
    const entityName = "PbPageElasticsearch";
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
            index: {
                type: "string"
            },
            data: {
                type: "map"
            },
            ...attributes
        }
    });
};
