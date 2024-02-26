import { FlushHookPlugin } from "@webiny/api-prerendering-service/flush/types";
import { CloudFront } from "@webiny/aws-sdk/client-cloudfront";

// This plugin will issue a cache invalidation request to CloudFront, every time a page has been deleted. This is
// mostly important when a user unpublishes a new page, and we want to make the page immediately publicly available.
export default (): FlushHookPlugin => {
    return {
        type: "ps-flush-hook",
        async afterFlush({ log, render, settings }) {
            if (!render) {
                log("Skipping afterFlush because no render was provided.");
                return;
            }

            // Let's create a cache invalidation request.
            log("Trying to send a CloudFront cache invalidation request...");

            const distributionId = settings.cloudfrontId;
            if (!distributionId) {
                log(`Exiting... PS settings do not contain a "cloudfrontId".`);
                return;
            }

            log("Trying to get the path that needs to be invalidated...");
            let path = render.path;

            if (!path) {
                log(`Aborting the cache invalidation attempt... "path" not detected.`);
                return;
            }

            path += "*";

            log(
                `Proceeding with issuing a cache invalidation request to CloudFront distribution "${distributionId}", path "${path}".`
            );

            const cloudfront = new CloudFront();
            try {
                await cloudfront.createInvalidation({
                    DistributionId: distributionId,
                    InvalidationBatch: {
                        CallerReference: `${new Date().getTime()}-api-prerender-service-aws-after-flush`,
                        Paths: {
                            Quantity: 1,
                            Items: [path]
                        }
                    }
                });
            } catch (e) {
                console.error(
                    `Failed to issue a cache invalidation request to CloudFront distribution "${distributionId}".`,
                    e.stack
                );
                return;
            }

            console.log(`Cache invalidation request (path "${path}") successfully issued.`);
        }
    };
};
