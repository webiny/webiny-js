import { createHandler } from "@webiny/handler-fastify-aws/gateway";
import transformFilePlugins from "@webiny/api-file-manager/handlers/transform";

export const handler = createHandler({
    plugins: [transformFilePlugins()]
});
