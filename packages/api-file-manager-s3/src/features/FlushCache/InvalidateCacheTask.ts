import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { CloudFront } from "@webiny/aws-sdk/client-cloudfront/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { executeWithRetry } from "@webiny/utils";

class ReturnContinue extends Error {}

export interface InvalidateCacheInput {
    /**
     * Caller of the task (e.g., `fm-before-update`, `fm-after-delete`).
     */
    caller: string;
    /**
     * Cache paths to invalidate.
     */
    paths: string[];
}

class InvalidateCloudfrontCacheTask implements TaskDefinition.Interface<InvalidateCacheInput> {
    id = "cloudfrontInvalidateCache";
    title = "Invalidate CloudFront Cache";
    description = "A task to invalidate Cloudfront cache by given paths.";
    maxIterations = 100;
    isPrivate = true;

    selfCleanup = ["onSuccess" as const, "onAbort" as const];

    private continueIfCode = ["TooManyInvalidationsInProgress", "Throttling"];

    public async run({ input, controller }: TaskDefinition.RunParams<InvalidateCacheInput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const manifest = await ServiceDiscovery.load();

        if (!manifest) {
            return controller.response.error({
                message: `Unable to invalidate cache due to a missing service manifest.`,
                code: "MISSING_SERVICE_MANIFEST",
                data: {
                    manifest: "api"
                }
            });
        }

        const { distributionId } = manifest.api.cloudfront;

        const invalidateCache = () => {
            return this.invalidateCache(input.caller, distributionId as string, input.paths);
        };

        try {
            await executeWithRetry(invalidateCache, {
                minTimeout: 2000,
                // instead of forever: true
                retries: 10000,
                onFailedAttempt: ({ error }) => {
                    if (this.continueIfCode.includes(error.name)) {
                        throw new ReturnContinue();
                    }

                    if (error.message.includes("not authorized to perform")) {
                        throw error;
                    }

                    if (controller.runtime.isCloseToTimeout()) {
                        throw new ReturnContinue();
                    }
                }
            });
        } catch (error) {
            if (error instanceof ReturnContinue) {
                return controller.response.continue(input);
            }

            return controller.response.error({
                message: error.message,
                code: "EXECUTE_WITH_RETRY_FAILED",
                data: input.paths
            });
        }

        return controller.response.done();
    }

    private async invalidateCache(
        caller: string,
        distributionId: string,
        paths: string[]
    ): Promise<void> {
        const cloudfront = new CloudFront();
        await cloudfront.createInvalidation({
            DistributionId: distributionId,
            InvalidationBatch: {
                CallerReference: `${new Date().getTime()}-${caller}`,
                Paths: {
                    Quantity: paths.length,
                    Items: paths
                }
            }
        });
    }
}

export const InvalidateCloudfrontCacheTaskDefinition = TaskDefinition.createImplementation({
    implementation: InvalidateCloudfrontCacheTask,
    dependencies: []
});
