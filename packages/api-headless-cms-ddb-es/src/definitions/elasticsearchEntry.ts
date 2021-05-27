import { Entity, Table } from "dynamodb-toolbox";

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
