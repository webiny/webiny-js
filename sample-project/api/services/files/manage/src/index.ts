import { createHandler } from "@webiny/http-handler";
import manageFilePlugins from "@webiny/serverless-files/functions/manage";

export const handler = createHandler(manageFilePlugins());
