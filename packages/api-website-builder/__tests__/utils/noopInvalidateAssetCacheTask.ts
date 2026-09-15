import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

/**
 * A no-op stand-in for the "invalidateAssetCache" task definition (implemented for real by
 * api-file-manager-s3 as a CloudFront invalidation).
 *
 * Website Builder file/page flows fire FlushCacheOn{Update,Delete}Handler, which call
 * `taskService.trigger({ definition: "invalidateAssetCache", ... })`. `trigger` validates that
 * a definition with this id exists (else TaskDefinitionNotFoundError), so it must be registered for
 * those flows to succeed. The task's real `run()` is never executed in tests — the mock TaskService
 * blocks dispatch to the runner — so only the id needs to match. We register this local no-op
 * instead of importing a real prod def to keep the WB test decoupled from storage-driver internals.
 */
class NoopInvalidateAssetCacheTaskHandlerImpl implements TaskHandler.Interface {
    async run({ controller }: TaskHandler.RunParams) {
        return controller.response.done();
    }
}

const NoopInvalidateAssetCacheTaskHandler = TaskHandler.createImplementation({
    implementation: NoopInvalidateAssetCacheTaskHandlerImpl,
    dependencies: []
});

class NoopInvalidateAssetCacheTaskImplementation implements TaskDefinition.Interface {
    id = "invalidateAssetCache";
    title = "Invalidate Asset Cache (test no-op)";
    isPrivate = true;

    handler = NoopInvalidateAssetCacheTaskHandler;
}

export const NoopInvalidateAssetCacheTaskDefinition = TaskDefinition.createImplementation({
    implementation: NoopInvalidateAssetCacheTaskImplementation,
    dependencies: []
});
