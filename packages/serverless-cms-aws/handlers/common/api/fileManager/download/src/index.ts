import { createHandler } from "@webiny/handler-aws/gateway";
import downloadFilePlugins from "@webiny/api-file-manager/handlers/download";

export const handler = createHandler({
    plugins: [downloadFilePlugins()]
});
