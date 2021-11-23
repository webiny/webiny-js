import { createHandler } from "@webiny/handler-aws";
import transformFilePlugins from "@webiny/api-file-manager/handlers/transform";

export const handler = createHandler(transformFilePlugins());
