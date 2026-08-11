import { DynamoDBClientConfig, DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export function getDocumentClient(params?: DynamoDBClientConfig, force?: boolean): DynamoDBDocument;
