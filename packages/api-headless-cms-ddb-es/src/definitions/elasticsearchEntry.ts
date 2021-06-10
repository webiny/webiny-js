import { Entity, Table } from "dynamodb-toolbox";

/**
 * TODO when saving this entity remove fields:
 * - ignore
 * - version
 * - savedOn
 */
export default (table: Table): Entity<any> => {
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
