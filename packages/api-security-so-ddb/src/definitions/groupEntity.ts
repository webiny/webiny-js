import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributesFromPlugins } from "@webiny/db-dynamodb/utils/attributes";
import { PluginsContainer } from "@webiny/plugins";

interface Params {
    table: Table;
    plugins: PluginsContainer;
}
export const createGroupEntity = (params: Params): Entity<any> => {
    const { plugins, table } = params;
    const entityName = "SecurityGroup";
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
            TYPE: {
                type: "string"
            },
            id: {
                type: "string"
            },
            tenant: {
                type: "string"
            },
            system: {
                type: "boolean"
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
            slug: {
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
