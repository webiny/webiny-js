import { createHandler } from "@webiny/handler";
import manageFilePlugins from "@webiny/serverless-files/functions/manage";

export const handler = createHandler(manageFilePlugins());
