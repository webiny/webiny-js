import { Result } from "@webiny/feature/api";
import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { CdnCacheTriggerError } from "./CdnCacheTriggerError.js";

/*
 * Invalidates CloudFront by starting `invalidateAssetCache`, the task this package defines and
 * registers in the same feature, so the task always exists where this implementation does.
 */
class TaskCdnCacheImpl implements CdnCache.Interface {
    constructor(private taskService: TaskService.Interface) {}

    async invalidate(params: CdnCache.InvalidateParams): CdnCache.Return {
        try {
            const result = await this.taskService.trigger({
                definition: "invalidateAssetCache",
                input: {
                    caller: params.caller,
                    paths: params.paths
                }
            });
            if (result.isFail()) {
                return Result.fail(result.error);
            }
            return Result.ok();
        } catch (error) {
            return Result.fail(new CdnCacheTriggerError(error));
        }
    }
}

export const TaskCdnCache = CdnCache.createImplementation({
    implementation: TaskCdnCacheImpl,
    dependencies: [TaskService]
});
