import { createFeature } from "@webiny/feature/api";
import { InvalidateCloudfrontCacheTaskDefinition } from "./InvalidateCloudfrontCacheTask.js";
import { TaskCdnCache } from "./TaskCdnCache.js";

/**
 * The CloudFront distribution in front of the API: the task that invalidates it, and the `CdnCache`
 * that starts the task. Registered from the `hostingConfig` hook, so it replaces api-core's
 * NullCdnCache.
 */
export const CloudFrontCdnCacheFeature = createFeature({
    name: "CloudFrontCdnCacheFeature",
    register(container) {
        container.register(InvalidateCloudfrontCacheTaskDefinition);
        container.register(TaskCdnCache);
    }
});
