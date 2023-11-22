import { createHandler } from "@webiny/handler-aws";
import { createManageFilePlugins } from "@webiny/api-file-manager/handlers/manage";

export const handler = createHandler({
    plugins: [createManageFilePlugins()]
});
