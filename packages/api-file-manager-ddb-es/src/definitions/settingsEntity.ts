import { Entity, Table } from "dynamodb-toolbox";

export interface SettingsEntityParams {
    table: Table;
}
export default (params: SettingsEntityParams): Entity<any> => {
    const { table } = params;
    const entityName = "FM.Settings";
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
            GSI1_PK: {
                type: "string"
            },
            GSI1_SK: {
                type: "string"
            },
            TYPE: {
                type: "string"
            },
            data: {
                type: "map"
            }
        }
    });
};
