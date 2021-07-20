import { CmsContext } from "@webiny/api-headless-cms/types";
import { Table } from "dynamodb-toolbox";
import configurations from "~/configurations";
import { getDocumentClient, getTable } from "~/operations/helpers";

interface IndexParams {
    partitionKey: string;
    sortKey: string;
}

interface Params {
    context: CmsContext;
    indexes: {
        [key: string]: IndexParams;
    };
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
