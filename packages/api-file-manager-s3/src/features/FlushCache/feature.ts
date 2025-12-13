import { createFeature } from "@webiny/feature/api";
import { FlushCacheOnFileDeleteHandler } from "./FlushCacheOnFileDeleteHandler.js";
import { FlushCacheOnFileUpdateHandler } from "./FlushCacheOnFileUpdateHandler.js";
import { InvalidateCloudfrontCacheTaskDefinition } from "./InvalidateCacheTask.js";

export const FlushCacheFeature = createFeature({
    name: "FileManagerS3/FlushCache",
    register(container) {
        container.register(FlushCacheOnFileDeleteHandler);
        container.register(FlushCacheOnFileUpdateHandler);
        container.register(InvalidateCloudfrontCacheTaskDefinition);
    }
});
