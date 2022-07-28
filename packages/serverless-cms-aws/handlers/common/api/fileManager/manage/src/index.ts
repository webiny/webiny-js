import { createHandler } from "@webiny/handler-fastify-aws";
import manageFilePlugins from "@webiny/api-file-manager/handlers/manage";

export const handler = createHandler({
    plugins: [manageFilePlugins()]
});
