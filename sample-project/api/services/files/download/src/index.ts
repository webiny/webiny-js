import { createHandler } from "@webiny/http-handler";
import downloadFilePlugins from "@webiny/serverless-files/functions/download";

export const handler = createHandler(downloadFilePlugins());
