import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

/*
 * Invalidates the API's CloudFront distribution by starting `invalidateAssetCache`, which the same
 * feature registers, so the task always exists where this implementation does. A failure, returned
 * or thrown, is logged and not passed on: the write that asked for it has already succeeded.
 */
class TaskCdnCacheImpl implements CdnCache.Interface {
    constructor(
        private taskService: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    async invalidate(params: CdnCache.InvalidateParams): Promise<void> {
        try {
            const result = await this.taskService.trigger({
                definition: "invalidateAssetCache",
                input: {
                    caller: params.caller,
                    paths: params.paths
                }
            });
            if (result.isFail()) {
                this.logger.error(
                    { error: result.error, ...params },
                    "Could not invalidate the CDN."
                );
            }
        } catch (error) {
            this.logger.error({ error, ...params }, "Could not invalidate the CDN.");
        }
    }
}

export const TaskCdnCache = CdnCache.createImplementation({
    implementation: TaskCdnCacheImpl,
    dependencies: [TaskService, Logger]
});
