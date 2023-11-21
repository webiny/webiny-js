import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws/gateway";
import {
    createDownloadFileByExactKeyPlugins,
    createDownloadFileByAliasPlugins
} from "@webiny/api-file-manager/handlers/download";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        createDownloadFileByExactKeyPlugins(),
        createDownloadFileByAliasPlugins({ documentClient })
    ]
});
