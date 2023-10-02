import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";

export function getDocumentClient(): DynamoDBClient;
export function simulateStream(documentClient: DynamoDBClient, handler: any): void;
