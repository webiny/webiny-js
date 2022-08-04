import { createHandler } from "@webiny/handler-aws/gateway";
import transformFilePlugins from "@webiny/api-file-manager/handlers/transform";

export const handler = createHandler({
    plugins: [transformFilePlugins()]
});
