import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { I18NContext } from "@webiny/api-i18n/types";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";

export default (params: {
    context: I18NContext;
    table: Table<string, string, string>;
}): Entity<any> => {
    const { context, table } = params;
    const entityName = "I18NSystem";
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
            tenant: {
                type: "string"
            },
            ...attributes
        }
    });
};
