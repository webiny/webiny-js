import { createHandler } from "@webiny/handler-aws";
import downloadFilePlugins from "@webiny/api-file-manager/handlers/download";

export const handler = createHandler(downloadFilePlugins());
