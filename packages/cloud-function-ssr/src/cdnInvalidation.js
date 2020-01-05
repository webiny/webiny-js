import CloudFront from "aws-sdk/clients/cloudfront";
import { withHooks } from "@webiny/commodo";

export default () => ({
    type: "context",
    name: "invalidate-cdn-ssr-cache",
    extend({ models: { SsrCache } }) {
        withHooks({
            async afterInvalidate() {
                const cloudfront = new CloudFront();
                try {
                    await cloudfront
                        .createInvalidation({
                            DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
                            InvalidationBatch: {
                                CallerReference: `${new Date().getTime()}-invalidate-cdn-ssr-cache`,
                                Paths: {
                                    Quantity: "1",
                                    Items: [this.path]
                                }
                            }
                        })
                        .promise();
                } catch (e) {
                    console.log(
                        `Failed to execute "afterInvalidate" callback in the "extend-models-invalidate-cdn-cache" plugin: `,
                        e.stack
                    );
                }
            }
        })(SsrCache);
    }
});
