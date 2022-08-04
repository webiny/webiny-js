import { createHandler } from "@webiny/handler-aws/gateway/download";
import { createDownloadFilePlugins } from "@webiny/api-file-manager/handlers/download";

export const handler = createHandler({
    plugins: [createDownloadFilePlugins()]
});
