export { QueryCommand } from "@aws-sdk/client-dynamodb";
export type {
    ScanInput,
    ScanOutput,
    WriteRequest,
    DynamoDBClient,
    DynamoDBClientConfig,
    AttributeValue
} from "@aws-sdk/client-dynamodb";

export type { StreamRecord } from "@aws-sdk/client-dynamodb-streams";

export {
    BatchWriteCommand,
    BatchGetCommand,
    PutCommand,
    ScanCommand,
    GetCommand,
    UpdateCommand,
    DeleteCommand,
    DynamoDBDocument,
    QueryCommand as DocQueryCommand
} from "@aws-sdk/lib-dynamodb";

export type {
    BatchWriteCommandInput,
    BatchWriteCommandOutput,
    BatchGetCommandInput,
    BatchGetCommandOutput,
    PutCommandInput,
    PutCommandOutput,
    UpdateCommandInput,
    GetCommandInput,
    GetCommandOutput,
    DeleteCommandInput,
    DeleteCommandOutput,
    ScanCommandInput,
    ScanCommandOutput,
    QueryCommandInput as DocQueryCommandInput,
    QueryCommandOutput
} from "@aws-sdk/lib-dynamodb";

export { unmarshall, marshall } from "@aws-sdk/util-dynamodb";

export { getDocumentClient } from "./getDocumentClient.js";
