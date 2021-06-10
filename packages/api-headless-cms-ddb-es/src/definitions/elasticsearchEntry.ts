import { Entity, Table } from "dynamodb-toolbox";
import { CmsContext } from "@webiny/api-headless-cms/types";

interface Params {
    table: Table;
    context: CmsContext;
}
/**
 * TODO when saving this entity remove fields:
 * - ignore
 * - version
 * - savedOn
 */
export default (params: Params): Entity<any> => {
    const { table } = params;
    return new Entity({
        name: "ContentElasticsearchEntry",
        table,
        attributes: {
            PK: {
                type: "string",
                partitionKey: true
            },
            SK: {
                type: "string",
                sortKey: true
            },
            index: {
                type: "string"
            },
            data: {
                type: "map"
            }
        }
    });
};
