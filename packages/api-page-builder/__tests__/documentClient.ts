import { DocumentClient } from "aws-sdk/clients/dynamodb";

// IMPORTANT: This must be removed from here in favor of a dynamic SO setup.
export const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});
