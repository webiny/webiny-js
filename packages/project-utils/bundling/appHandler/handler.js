import "source-map-support/register";
import { createHandler } from "@webiny/handler";
import filesPlugins from "@webiny/handler-files";
import indexPlugins from "@webiny/handler-index";

export const handler = createHandler(filesPlugins(), indexPlugins());
