import { create } from "@webiny/cloud-function";
import filesPlugins from "@webiny/cloud-function-files";
import ssrPlugins from "@webiny/cloud-function-ssr";
import cdnInvalidationPlugins from "@webiny/cloud-function-ssr/cdnInvalidation";

export const handler = create(filesPlugins(), ssrPlugins(), cdnInvalidationPlugins());
