import { Entity, Table } from "dynamodb-toolbox";

export interface SystemEntityParams {
    table: Table;
}
export default (params: SystemEntityParams): Entity<any> => {
    const { table } = params;
    const entityName = "System";
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
            }
        }
    });
};
