import { createHandler } from "@webiny/http-handler";
import transformFilePlugins from "@webiny/serverless-files/functions/transform";

export const handler = createHandler(transformFilePlugins());
