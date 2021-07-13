import { AdminUsersContext } from "@webiny/api-security-admin-users/types";
import { Table } from "dynamodb-toolbox";
import configurations from "~/configurations";
import { getDocumentClient, getTable } from "~/utils";
import { TableIndexes } from "dynamodb-toolbox/dist/classes/Table";

interface Params {
    context: AdminUsersContext;
    indexes: TableIndexes;
}
export const createTable = ({ context, indexes }: Params) => {
    return new Table({
        name: configurations.db().table || getTable(context),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: getDocumentClient(context),
        indexes
    });
};
