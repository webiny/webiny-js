import { createHandler } from "@webiny/handler-aws";
import logsPlugins from "@webiny/handler-logs";
import downloadFilePlugins from "@webiny/api-file-manager/handlers/download";

export const handler = createHandler(logsPlugins(), downloadFilePlugins());
