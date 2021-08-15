import { Table } from "dynamodb-toolbox";
import configurations from "~/operations/configurations";
import { getDocumentClient, getTable } from "~/operations/utils";
import { I18NContext } from "@webiny/api-i18n/types";

export default (params: { context: I18NContext }): Table => {
    const { context } = params;
    return new Table({
        name: configurations.db().table || getTable(context),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: getDocumentClient(context)
    });
};
