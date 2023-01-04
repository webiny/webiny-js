import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createFoldersContext, createFoldersGraphQL } from "@webiny/api-folders";
import { createStorageOperations } from "@webiny/api-folders-so-ddb";

// IMPORTANT: This must be removed from here in favor of a dynamic SO setup.
const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export const createFolders = () => {
    return [
        createFoldersContext({
            storageOperations: createStorageOperations({
                documentClient,
                table: process.env.DB_TABLE
            })
        }),
        createFoldersGraphQL()
    ];
};
