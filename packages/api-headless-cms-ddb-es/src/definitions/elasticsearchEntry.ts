import { Entity, Table } from "dynamodb-toolbox";
import { CmsContext } from "@webiny/api-headless-cms/types";
/**
 * TODO when saving this entity remove fields:
 * - ignore
 * - version
 * - savedOn
 */
export default (params: { table: Table; context: CmsContext }): Entity<any> => {
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
