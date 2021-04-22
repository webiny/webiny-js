import { createHandler } from "@webiny/handler-aws";
import manageFilePlugins from "@webiny/api-file-manager/handlers/manage";
import logsPlugins from "@webiny/handler-logs";

export const handler = createHandler(logsPlugins(), manageFilePlugins());
