const { Component } = require("@serverless/core");
const CloudFront = require("aws-sdk/clients/cloudfront");
const get = require("lodash.get");

class ServerlessAwsCloudfront extends Component {
    async default(inputs = {}) {
        const cf = await this.load("@serverless/aws-cloudfront");
        const output = await cf(inputs);

        const cloudfrontClient = new CloudFront();

        const forwardIdViaHeadersChanged =
            get(this.state, "output.forwardIdViaHeaders") !== inputs.forwardIdViaHeaders;

        if (forwardIdViaHeadersChanged) {
            output.forwardIdViaHeaders = inputs.forwardIdViaHeaders;
            const { DistributionConfig, ETag } = await cloudfrontClient
                .getDistributionConfig({ Id: output.id })
                .promise();

            if (inputs.forwardIdViaHeaders) {
                DistributionConfig.Origins.Items.forEach(origin => {
                    let hasHeader = false;
                    for (let i = 0; i < origin.CustomHeaders.Items.length; i++) {
                        const item = origin.CustomHeaders.Items[i];
                        if (item.HeaderName === "X-Cdn-Id") {
                            item.HeaderValue = output.id;
                            hasHeader = true;
                            break;
                        }
                    }

                    if (!hasHeader) {
                        origin.CustomHeaders.Quantity++;
                        origin.CustomHeaders.Items.push({
                            HeaderName: "X-Cdn-Id",
                            HeaderValue: output.id
                        });
                    }
                });

                this.context.instance.debug(
                    `Adding custom header forwarding - Cloudfront Distribution ID.`
                );
            } else {
                DistributionConfig.Origins.Items.forEach(origin => {
                    let headerItemIndex = null;
                    for (let i = 0; i < origin.CustomHeaders.Items.length; i++) {
                        const item = origin.CustomHeaders.Items[i];
                        if (item.HeaderName === "X-Cdn-Id") {
                            headerItemIndex = i;
                            break;
                        }
                    }

                    if (headerItemIndex !== null) {
                        origin.CustomHeaders.Items.splice(headerItemIndex, 1);
                        origin.CustomHeaders.Quantity--;
                    }
                });

                this.context.instance.debug(
                    `Removing custom header forwarding - Cloudfront Distribution ID.`
                );
            }

            await cloudfrontClient
                .updateDistribution({ DistributionConfig, Id: output.id, IfMatch: ETag })
                .promise();
        }

        if (inputs.invalidateOnDeploy === true) {
            this.context.instance.debug(`Creating a CDN cache invalidation request.`);
            await cloudfrontClient
                .createInvalidation({
                    DistributionId: output.id,
                    InvalidationBatch: {
                        CallerReference: `${new Date().getTime()}-serverless-aws-cloudfront-on-deploy`,
                        Paths: {
                            Quantity: "1",
                            Items: ["/*"]
                        }
                    }
                })
                .promise();
        } else {
            this.context.instance.debug(`Skipping creation of CDN cache invalidation request.`);
        }

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const cf = await this.load("@serverless/aws-cloudfront");
        await cf.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessAwsCloudfront;
