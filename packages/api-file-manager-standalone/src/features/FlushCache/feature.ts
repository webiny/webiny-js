import { createFeature } from "@webiny/feature/api";
import { FlushCacheOnFileDeleteHandler } from "./FlushCacheOnFileDeleteHandler.js";
import { FlushCacheOnFileBeforeUpdateHandler } from "./FlushCacheOnFileBeforeUpdateHandler.js";

export const FlushCacheFeature = createFeature({
    name: "FileManagerServer/FlushCache",
    register(container) {
        container.register(FlushCacheOnFileDeleteHandler);
        container.register(FlushCacheOnFileBeforeUpdateHandler);
    }
});
