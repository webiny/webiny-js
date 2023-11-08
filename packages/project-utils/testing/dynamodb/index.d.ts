import { DynamoDBClient, DynamoDBClientConfig } from "@webiny/aws-sdk/client-dynamodb";

export function getDocumentClient(params?: DynamoDBClientConfig, force?: boolean): DynamoDBClient;
export function simulateStream(documentClient: DynamoDBClient, handler: any): void;
