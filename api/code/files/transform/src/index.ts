import { createHandler } from "@webiny/handler-aws";
import transformFilePlugins from "@webiny/serverless-files/functions/transform";

export const handler = createHandler(transformFilePlugins());
