import { createHandler } from "@webiny/handler-aws/s3";
import manageFilePlugins from "@webiny/api-file-manager/handlers/manage";

export const handler = createHandler({
    plugins: [manageFilePlugins()]
});
