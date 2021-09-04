import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { PluginsContainer } from "@webiny/plugins";

interface Params {
    plugins: PluginsContainer;
    table: Table;
}
export const createSystemEntity = ({ table, plugins }: Params): Entity<any> => {
    const entityName = "SecuritySystem";
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
            version: {
                type: "string"
            },
            ...attributes
        }
    });
};
