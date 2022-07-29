import { createHandler } from "@webiny/handler-fastify-aws/gateway";
import { createDownloadFilePlugins } from "@webiny/api-file-manager/handlers/download";

export const handler = createHandler({
    plugins: [createDownloadFilePlugins()]
});
