import { createInvalidateCacheTask } from "./invalidateCacheTaskDefinition.js";

export const flushCdnCache = () => {
    return [createInvalidateCacheTask()];
};
