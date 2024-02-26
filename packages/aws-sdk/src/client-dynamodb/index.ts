export { QueryCommand, ScanInput, ScanOutput, WriteRequest } from "@aws-sdk/client-dynamodb";
export type {
    DynamoDBClient,
    DynamoDBClientConfig,
    AttributeValue
} from "@aws-sdk/client-dynamodb";

export type { StreamRecord } from "@aws-sdk/client-dynamodb-streams";

export {
    GetCommandOutput,
    BatchWriteCommand,
    PutCommand,
    GetCommand,
    UpdateCommand,
    DeleteCommand,
    DynamoDBDocument
} from "@aws-sdk/lib-dynamodb";

export { unmarshall, marshall } from "@aws-sdk/util-dynamodb";

export { getDocumentClient } from "./getDocumentClient";
