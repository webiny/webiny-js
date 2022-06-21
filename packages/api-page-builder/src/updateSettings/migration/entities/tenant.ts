import { Entity, Table } from "dynamodb-toolbox";

interface Params {
    entityName: string;
    table: Table;
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
            },
            name: {
                type: "string"
            },
            description: {
                type: "string"
            },
            status: {
                type: "string",
                default: "active"
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
            parent: {
                type: "string"
            },
            webinyVersion: {
                type: "string"
            },
            settings: {
                type: "map",
                default: {}
            }
        }
    });
};
