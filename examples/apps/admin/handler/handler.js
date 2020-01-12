import { createHandler } from "@webiny/http-handler";
import filesPlugins from "@webiny/http-handler-files";
import indexPlugins from "@webiny/http-handler-index";

export const handler = createHandler(filesPlugins(), indexPlugins());
