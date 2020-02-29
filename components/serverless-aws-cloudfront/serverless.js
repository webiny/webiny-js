const { Component } = require("@serverless/core");
const CloudFront = require("aws-sdk/clients/cloudfront");
const get = require("lodash.get");
const setCdnDistributionForwardedHeader = require("./utils/setCdnDistributionForwardedHeader");
const unsetCdnDistributionForwardedHeader = require("./utils/unsetCdnDistributionForwardedHeader");

class ServerlessAwsCloudfront extends Component {
    async default(inputs = {}) {
        const cf = await this.load("@serverless/aws-cloudfront");
        const output = await cf(inputs);

        const cloudfrontClient = new CloudFront();

        // Get CDN Distribution's config and the ETag.
        const { DistributionConfig, ETag } = await cloudfrontClient
            .getDistributionConfig({ Id: output.id })
            .promise();

        // Append deployment ID (a simple timestamp) into the forwarded headers list.
        this.context.instance.debug(`Adding "X-Cdn-Deployment-Id" forwarded header...`);

        setCdnDistributionForwardedHeader({
            DistributionConfig,
            key: "X-Cdn-Deployment-Id",
            value: String(new Date().getTime())
        });

        // If enabled, append CDN ID into the forwarded headers list.
        const forwardIdViaHeadersChanged =
            get(this.state, "output.forwardIdViaHeaders") !== inputs.forwardIdViaHeaders;

        if (forwardIdViaHeadersChanged) {
            output.forwardIdViaHeaders = inputs.forwardIdViaHeaders;

            if (inputs.forwardIdViaHeaders) {
                this.context.instance.debug(`Adding "X-Cdn-Id" forwarded header...`);
                setCdnDistributionForwardedHeader({
                    DistributionConfig,
                    key: "X-Cdn-Id",
                    value: output.id
                });
            } else {
                this.context.instance.debug(`Removing "X-Cdn-Deployment-Id" forwarded header...`);
                unsetCdnDistributionForwardedHeader({ DistributionConfig, key: "X-Cdn-Id" });
            }
        }

        this.context.instance.debug(`Updating CDN with forwarded headers...`);
        await cloudfrontClient
            .updateDistribution({ DistributionConfig, Id: output.id, IfMatch: ETag })
            .promise();

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
