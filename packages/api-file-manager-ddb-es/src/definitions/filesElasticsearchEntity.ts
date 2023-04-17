import { Entity, Table } from "dynamodb-toolbox";

export interface FileElasticsearchEntityParams {
    table: Table;
}
export default ({ table }: FileElasticsearchEntityParams): Entity<any> => {
    const entityName = "FilesElasticsearch";
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
            }
        }
    });
};
