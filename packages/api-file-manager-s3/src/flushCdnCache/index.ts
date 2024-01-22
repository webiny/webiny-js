import { flushCacheOnFileUpdate } from "~/flushCdnCache/flushCacheOnFileUpdate";
import { flushCacheOnFileDelete } from "~/flushCdnCache/flushCacheOnFileDelete";
import { createInvalidateCacheTask } from "./invalidateCacheTaskDefinition";

export const flushCdnCache = () => {
    return [flushCacheOnFileUpdate(), flushCacheOnFileDelete(), createInvalidateCacheTask()];
};
