import "source-map-support/register";
import { createHandler } from "@webiny/handler";
import filesPlugins from "@webiny/handler-files";

export const handler = createHandler(filesPlugins());
