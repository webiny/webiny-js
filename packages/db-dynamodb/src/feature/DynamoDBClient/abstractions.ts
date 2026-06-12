import { createAbstraction } from "@webiny/feature/api";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface IDynamoDBClient {
    readonly client: DynamoDBDocument;
}

export const DynamoDBClient = createAbstraction<IDynamoDBClient>("Db/DynamoDB/DynamoDBClient");

export namespace DynamoDBClient {
    export type Interface = IDynamoDBClient;
}
