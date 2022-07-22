import { createHandler } from "@webiny/handler-fastify-aws";
import downloadFilePlugins from "@webiny/api-file-manager/handlers/download";

export const handler = createHandler({
    plugins: [downloadFilePlugins()]
});
