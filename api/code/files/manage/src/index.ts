import { createHandler } from "@webiny/handler-aws";
import manageFilePlugins from "@webiny/serverless-files/functions/manage";

export const handler = createHandler(manageFilePlugins());
