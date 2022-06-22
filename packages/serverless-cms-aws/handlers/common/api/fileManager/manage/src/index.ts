import { createHandler } from "@webiny/handler-aws";
import manageFilePlugins from "@webiny/api-file-manager/handlers/manage";

export const handler = createHandler(manageFilePlugins());
