import CloudFront from "aws-sdk/clients/cloudfront";
import { withHooks } from "@webiny/commodo";

export default rawOptions => ({
    type: "context",
    name: "invalidate-cdn-ssr-cache",
    apply({ models: { SsrCache } }) {
        const options = {
            cloudFrontDistributionId: process.env.CDN_ID,
            ...rawOptions
        };

        withHooks({
            async afterInvalidate() {
                const cloudfront = new CloudFront();
                try {
                    if (!options.cloudFrontDistributionId) {
                        throw new Error(
                            `Missing "cloudFrontDistributionId". Ether set it via "CDN_ID" env variable or passing the 
                                "cloudFrontDistributionId" value when creating "cdnInvalidation" plugins.`
                        );
                    }

                    await cloudfront
                        .createInvalidation({
                            DistributionId: options.cloudFrontDistributionId,
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
                    // eslint-disable-next-line
                    console.log(
                        `Failed to execute "afterInvalidate" callback in the "extend-models-invalidate-cdn-cache" plugin: `,
                        e.stack
                    );
                }
            }
        })(SsrCache);
    }
});
