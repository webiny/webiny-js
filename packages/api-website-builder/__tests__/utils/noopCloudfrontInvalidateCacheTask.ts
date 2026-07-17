import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

/**
 * A no-op stand-in for api-file-manager-s3's "cloudfrontInvalidateCache" task definition.
 *
 * Website Builder file/page flows fire FlushCacheOn{Update,Delete}Handler, which call
 * `taskService.trigger({ definition: "cloudfrontInvalidateCache", ... })`. `trigger` validates that
 * a definition with this id exists (else TaskDefinitionNotFoundError), so it must be registered for
 * those flows to succeed. The task's real `run()` (a CloudFront invalidation) is never executed in
 * tests — the mock TaskService blocks dispatch to the runner — so only the id needs to match. We
 * register this local no-op instead of importing the real prod def to keep the WB test decoupled
 * from api-file-manager-s3 internals.
 */
export const NoopCloudfrontInvalidateCacheTaskDefinition = TaskDefinition.createImplementation({
    implementation: class implements TaskDefinition.Interface {
        id = "cloudfrontInvalidateCache";
        title = "Invalidate CloudFront Cache (test no-op)";
        isPrivate = true;

        async run({ controller }: TaskDefinition.RunParams) {
            return controller.response.done();
        }
    },
    dependencies: []
});
