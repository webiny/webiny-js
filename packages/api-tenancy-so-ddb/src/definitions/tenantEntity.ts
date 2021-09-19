import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributesFromPlugins } from "@webiny/db-dynamodb/utils/attributes";
import { PluginsContainer } from "@webiny/plugins";

interface Params {
    plugins: PluginsContainer;
    table: Table;
}
export const createTenantEntity = ({ table, plugins }: Params): Entity<any> => {
    const entityName = "TenancyTenant";
    const attributes = getExtraAttributesFromPlugins(plugins, entityName);
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
            id: {
                type: "string"
            },
            name: {
                type: "string"
            },
            description: {
                type: "string"
            },
            parent: {
                type: "string"
            },
            ...attributes
        }
    });
};
