import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { PluginsContainer } from "@webiny/plugins";

interface Params {
    plugins: PluginsContainer;
    table: Table;
}
export const createLinkEntity = (params: Params): Entity<any> => {
    const { plugins, table } = params;
    const entityName = "SecurityIdentity2Tenant";
    const attributes = getExtraAttributes(plugins, entityName);
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
            identity: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            type: {
                type: "string"
            },
            data: {
                type: "map"
            },
            ...attributes
        }
    });
};
