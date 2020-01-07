const { Component } = require("@serverless/core");
const CloudFront = require("aws-sdk/clients/cloudfront");

class ServerlessAwsCloudfront extends Component {
    async default(inputs = {}) {
        const cf = await this.load("@serverless/aws-cloudfront");
        const output = await cf(inputs);

        this.state.output = output;
        await this.save();

        if (inputs.invalidateOnDeploy === true) {
            this.context.instance.debug(`Creating a CDN cache invalidation request.`);
            const cloudfront = new CloudFront();
            await cloudfront
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
