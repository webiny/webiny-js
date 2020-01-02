import { createHandler } from "@webiny/api-web-server";
import { files, ssr } from "@webiny/api-web-server/plugins/handlers";
import { fs } from "@webiny/api-web-server/plugins/loaders";

export const handler = createHandler(
    files({ fileLoader: fs }),
    ssr({ ssrFunction: process.env.SSR_FUNCTION, ssrCacheTtl: 80, ssrCacheTtlState: 20 })
);
