import { DynamoDBClientConfig, DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";

export function getDocumentClient(params?: DynamoDBClientConfig, force?: boolean): DynamoDBDocument;
export function simulateStream(documentClient: DynamoDBDocument, handler: any): void;
