import { Entity, Table } from "dynamodb-toolbox";
import { getExtraAttributes } from "@webiny/db-dynamodb/utils/attributes";
import { AdminUsersContext } from "@webiny/api-security-admin-users/types";

interface Params {
    context: AdminUsersContext;
    table: Table;
}

export const createEntity = (params: Params): Entity<any> => {
    const { context, table } = params;
    const entityName = "AdminUsers";
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
            TYPE: {
                type: "string"
            },
            id: {
                type: "string"
            },
            token: {
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
                type: "map"
            },
            ...attributes
        }
    });
};
