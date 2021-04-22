import { createHandler } from "@webiny/handler-aws";
import transformFilePlugins from "@webiny/api-file-manager/handlers/transform";
import logsPlugins from "@webiny/handler-logs";

export const handler = createHandler(logsPlugins(), transformFilePlugins());
