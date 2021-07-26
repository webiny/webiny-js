import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { AdminUsersContext } from "@webiny/api-security-admin-users/types";

interface Params {
    context: AdminUsersContext;
    table: Table;
}

export const createApiKeyEntity = (params: Params): Entity<any> => {
    const { context, table } = params;
    const entityName = "SecurityApiKey";
    const attributes = getExtraAttributes(context, entityName);
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
