import { Entity, Table } from "dynamodb-toolbox";
import { I18NContext } from "@webiny/api-i18n/types";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";

export default (params: { context: I18NContext; table: Table }): Entity<any> => {
    const { context, table } = params;
    const entityName = "System";
    const attributes = getExtraAttributes(context, entityName);
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
            ...attributes
        }
    });
};
