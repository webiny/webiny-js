import CloudFront from "aws-sdk/clients/cloudfront";
import { withHooks } from "@webiny/commodo";

export default () => ({
    type: "context",
    name: "context-cdn-ssr-cache-invalidation",
    apply({
        context: {
            models: { SsrCache }
        },
        args
    }) {
        withHooks({
            async afterInvalidate() {
                const cloudfront = new CloudFront();
                try {
                    const [event] = args;
                    const DistributionId = event.headers["X-Cdn-Id"];
                    if (!DistributionId) {
                        throw new Error(
                            `Missing "X-Cdn-Id" header. Make sure to set "forwardIdViaHeaders" option on the CDN component to true`
                        );
                    }

                    await cloudfront
                        .createInvalidation({
                            DistributionId,
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
