import { Entity, Table } from "dynamodb-toolbox";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
}

export const createTenantEntity = ({ entityName, table }: Params): Entity<any> => {
    return new Entity({
        table,
        name: entityName,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
                sortKey: true
            },
            GSI1_PK: {
                type: "string"
            },
            GSI1_SK: {
                type: "string"
            },
            TYPE: {
                type: "string"
            },
            id: {
                type: "string"
            }
        }
    });
};
