import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createWcpContext } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws/gateway";
import {
    createDownloadFileByAliasPlugins,
    createDownloadFileByExactKeyPlugins
} from "@webiny/api-file-manager/handlers/download";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        createWcpContext(),
        createDownloadFileByExactKeyPlugins(),
        createDownloadFileByAliasPlugins({ documentClient })
    ]
});
