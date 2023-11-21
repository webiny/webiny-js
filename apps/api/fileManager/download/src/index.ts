import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHandler } from "@webiny/handler-aws/gateway";
import {
    createDownloadFileByAliasPlugins,
    createDownloadFileByExactKeyPlugins
} from "@webiny/api-file-manager/handlers/download";

const documentClient = getDocumentClient();

export const handler = createHandler({
    plugins: [
        createDownloadFileByExactKeyPlugins(),
        createDownloadFileByAliasPlugins({ documentClient })
    ]
});
