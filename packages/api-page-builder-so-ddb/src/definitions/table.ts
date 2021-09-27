import { Table } from "dynamodb-toolbox";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { getTable } from "@webiny/db-dynamodb/utils/table";
import { getDocumentClient } from "@webiny/db-dynamodb/utils/documentClient";

interface IndexParams {
    partitionKey: string;
    sortKey: string;
}

export interface Params {
    context: PbContext;
    indexes?: {
        [key: string]: IndexParams;
    };
}

export const defineTable = (params: Params): Table => {
    const { context, indexes } = params;
    return new Table({
        name: process.env.DB_TABLE_PAGE_BUILDER || getTable(context),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: getDocumentClient(context),
        indexes
    });
};
