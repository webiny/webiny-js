import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { Table, TableConstructor } from "@webiny/db-dynamodb/toolbox";

interface Params {
    documentClient: DynamoDBDocument;
}

export const createTable = ({ documentClient }: Params): Table<string, string, string> => {
    const config: TableConstructor<string, string, string> = {
        name: process.env.DB_TABLE_ELASTICSEARCH as string,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        autoExecute: true,
        autoParse: true
    };

    return new Table(config);
};
