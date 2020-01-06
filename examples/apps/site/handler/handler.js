import { create } from "@webiny/cloud-function";
import filesPlugins from "@webiny/cloud-function-files";
import ssrPlugins from "@webiny/cloud-function-ssr";
import cdnCacheInvalidationPlugins from "@webiny/cloud-function-ssr/cdnCacheInvalidation";

export const handler = create(filesPlugins(), ssrPlugins(), cdnCacheInvalidationPlugins());
