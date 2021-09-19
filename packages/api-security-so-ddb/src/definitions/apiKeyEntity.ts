import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributesFromPlugins } from "@webiny/db-dynamodb/utils/attributes";
import { PluginsContainer } from "@webiny/plugins";

interface Params {
    table: Table;
    plugins: PluginsContainer;
}

export const createApiKeyEntity = (params: Params): Entity<any> => {
    const { plugins, table } = params;
    const entityName = "SecurityApiKey";
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
            TYPE: {
                type: "string"
            },
            id: {
                type: "string"
            },
            token: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            createdBy: {
                type: "map"
            },
            createdOn: {
                type: "string"
            },
            name: {
                type: "string"
            },
            description: {
                type: "string"
            },
            permissions: {
                type: "list"
            },
            ...attributes
        }
    });
};
