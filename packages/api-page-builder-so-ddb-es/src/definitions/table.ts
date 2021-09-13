import { Table } from "dynamodb-toolbox";
import configurations from "~/operations/configurations";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { getTable } from "@webiny/db-dynamodb/utils/table";
import { getDocumentClient } from "@webiny/db-dynamodb/utils/documentClient";

export interface Params {
    context: PbContext;
}

export const defineTable = (params: Params): Table => {
    const { context } = params;
    return new Table({
        name: configurations.db().table || getTable(context),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: getDocumentClient(context)
    });
};
