import {
    getDocumentClient as getBaseDocumentClient,
    type DynamoDBClientConfig,
    type DynamoDBDocument
} from "@webiny/aws-sdk/client-dynamodb/index.js";

let documentClient: DynamoDBDocument | null = null;

export const getDocumentClient = (
    params: Partial<DynamoDBClientConfig> = {},
    forceNew = false
): DynamoDBDocument => {
    let client = documentClient;
    if (!client || forceNew) {
        client = getBaseDocumentClient({
            endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
            tls: false,
            region: "local",
            credentials: { accessKeyId: "test", secretAccessKey: "test" },
            ...params
        });
        if (forceNew) {
            return client;
        }
    }
    documentClient = client;

    return documentClient!;
};
