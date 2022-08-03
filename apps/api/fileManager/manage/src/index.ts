import { createHandler } from "@webiny/handler-fastify-aws/s3";
import { createManageFilePlugins } from "@webiny/api-file-manager/handlers/manage";

export const handler = createHandler({
    plugins: [createManageFilePlugins()]
});
