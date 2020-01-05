import { create } from "@webiny/cloud-function";
import filesPlugins from "@webiny/cloud-function-files";
import indexPlugins from "@webiny/cloud-function-index";

export const handler = create(filesPlugins(), indexPlugins());
