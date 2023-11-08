import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";

// https://github.com/jeremydaly/dynamodb-toolbox
import { Table } from "@webiny/db-dynamodb/toolbox";

const DocumentClient = getDocumentClient();

/**
 * Everything starts with a table. Note that the `name` property is passed via an environment
 * variable, which is defined upon cloud infrastructure deployment. On the other hand, while
 * running tests, the value is read from cloud infrastructure state files (that were generated
 * during a previous deployment).
 * https://www.webiny.com/docs/how-to-guides/scaffolding/extend-graphql-api#essential-files
 */
export default new Table({
    name: process.env.DB_TABLE as string,
    partitionKey: "PK",
    sortKey: "SK",
    entityField: "TYPE",
    DocumentClient,
    autoExecute: true,
    autoParse: true
});
