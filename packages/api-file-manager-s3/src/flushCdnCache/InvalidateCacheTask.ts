import { ServiceDiscovery } from "@webiny/api";
import { CloudFront } from "@webiny/aws-sdk/client-cloudfront";
import { ITaskRunParams } from "@webiny/tasks/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { executeWithRetry } from "@webiny/utils";
import { ITaskResponseResult } from "@webiny/tasks/response/abstractions";

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

export class InvalidateCloudfrontCacheTask {
    private continueIfCode = ["TooManyInvalidationsInProgress", "Throttling"];

    public async run({
        input,
        response,
        isCloseToTimeout
    }: ITaskRunParams<FileManagerContext, InvalidateCacheInput>): Promise<ITaskResponseResult> {
        const manifest = await ServiceDiscovery.load();

        if (!manifest) {
            return response.error({
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
                forever: true,
                onFailedAttempt: err => {
                    if (this.continueIfCode.includes(err.name)) {
                        throw new ReturnContinue();
                    }

                    if (err.message.includes("not authorized to perform")) {
                        throw err;
                    }

                    if (isCloseToTimeout()) {
                        throw new ReturnContinue();
                    }
                }
            });
        } catch (error) {
            if (error instanceof ReturnContinue) {
                return response.continue(input);
            }

            return response.error({
                message: error.message,
                code: "EXECUTE_WITH_RETRY_FAILED",
                data: input.paths
            });
        }

        return response.done();
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
