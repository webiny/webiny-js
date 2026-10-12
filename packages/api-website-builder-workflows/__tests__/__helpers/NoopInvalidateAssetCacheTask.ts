import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

/**
 * A no-op "invalidateAssetCache" task definition, as in `api-website-builder`'s tests: page flows
 * trigger it and `TaskService.trigger` requires the definition to exist. The mock TaskService never
 * runs it.
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
