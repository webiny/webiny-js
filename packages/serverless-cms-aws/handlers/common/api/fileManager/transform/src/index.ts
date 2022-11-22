import { createHandler } from "@webiny/handler-aws/raw";
import { createTransformFilePlugins } from "@webiny/api-file-manager/handlers/transform";

export const handler = createHandler({
    plugins: [createTransformFilePlugins()]
});
