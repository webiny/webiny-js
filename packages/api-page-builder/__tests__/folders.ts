import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ContextPlugin } from "@webiny/api";
import { FoldersContext, Link } from "@webiny/api-folders/types";
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
        createFoldersGraphQL(),
        new ContextPlugin<FoldersContext>(async context => {
            context.folders.createLink = async ({ id, folderId }): Promise<Link> => {
                return {
                    id: id || "id",
                    linkId: "linkId",
                    folderId: folderId || "folderId",
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: "1",
                        displayName: "Admin Webiny",
                        type: "type"
                    },
                    tenant: "root",
                    locale: "en-US",
                    webinyVersion: process.env.WEBINY_VERSION || "5.34.0"
                };
            };
        })
    ];
};
