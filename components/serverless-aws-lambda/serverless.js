const path = require("path");
const AwsSdkLambda = require("aws-sdk/clients/lambda");
const { mergeDeepRight, pick } = require("ramda");
const { Component, utils } = require("@serverless/core");
const {
    createLambda,
    updateLambdaCode,
    updateLambdaConfig,
    getLambda,
    deleteLambda,
    configChanged,
    pack
} = require("./utils");

const outputsList = [
    "name",
    "description",
    "memory",
    "timeout",
    "code",
    "bucket",
    "shims",
    "handler",
    "runtime",
    "env",
    "role",
    "layer",
    "arn",
    "region"
];

const defaults = {
    description: "AWS Lambda Component",
    memory: 512,
    timeout: 10,
    code: process.cwd(),
    bucket: undefined,
    shims: [],
    handler: "handler.hello",
    runtime: "nodejs10.x",
    env: {},
    region: "us-east-1"
};

class AwsLambda extends Component {
    async default(inputs = {}) {
        this.context.status(`Deploying`);

        const config = mergeDeepRight(defaults, inputs);

        if (!config.name) {
            config.name = this.state.name || this.context.resourceId();
        }

        this.context.instance.debug(
            `Starting deployment of lambda %o to the %o region.`,
            config.name,
            config.region
        );

        const lambda = new AwsSdkLambda({
            region: config.region,
            credentials: this.context.credentials.aws
        });

        const awsIamRole = await this.load("@serverless/aws-iam-role");

        // If no role exists, create a default role
        let outputsAwsIamRole;
        if (!config.role) {
            this.context.instance.debug(`No role provided for lambda %o`, config.name);

            outputsAwsIamRole = await awsIamRole({
                service: "lambda.amazonaws.com",
                policy: {
                    arn: "arn:aws:iam::aws:policy/AdministratorAccess"
                },
                region: config.region
            });
            config.role = { arn: outputsAwsIamRole.arn };
        } else {
            outputsAwsIamRole = await awsIamRole(config.role);
            config.role = { arn: outputsAwsIamRole.arn };
        }

        if (
            config.bucket &&
            config.runtime === "nodejs10.x" &&
            (await utils.dirExists(path.join(config.code, "node_modules")))
        ) {
            this.context.instance.debug(
                `Bucket %o is provided for lambda %o`,
                config.bucket,
                config.name
            );

            const layer = await this.load("@serverless/aws-lambda-layer");

            const layerInputs = {
                description: `${config.name} Dependencies Layer`,
                code: path.join(config.code, "node_modules"),
                runtimes: ["nodejs10.x"],
                prefix: "nodejs/node_modules",
                bucket: config.bucket,
                region: config.region
            };

            this.context.status("Deploying Dependencies");
            this.context.instance.debug(`Packaging lambda code from %o`, config.code);
            this.context.instance.debug(
                `Uploading dependencies as a layer for lambda %o.`,
                config.name
            );

            const promises = [pack(config.code, config.shims, false), layer(layerInputs)];
            const res = await Promise.all(promises);
            config.zipPath = res[0];
            config.layer = res[1];
        } else {
            this.context.status("Packaging");
            this.context.instance.debug(`Packaging lambda code from %o`, config.code);
            config.zipPath = await pack(config.code, config.shims);
        }

        config.hash = await utils.hashFile(config.zipPath);

        let deploymentBucket;
        if (config.bucket) {
            deploymentBucket = await this.load("@serverless/aws-s3");
        }

        const prevLambda = await getLambda({ lambda, ...config });

        if (!prevLambda) {
            if (config.bucket) {
                this.context.instance.debug(
                    `Uploading %o lambda package to bucket %o.`,
                    config.name,
                    config.bucket
                );
                this.context.status(`Uploading`);

                await deploymentBucket.upload({ name: config.bucket, file: config.zipPath });
            }

            this.context.status(`Creating`);
            this.context.instance.debug(
                `Creating lambda %o in the %o region.`,
                config.name,
                config.region
            );

            config.arn = await createLambda({ lambda, ...config });
        } else {
            config.arn = prevLambda.arn;
            if (configChanged(prevLambda, config)) {
                if (config.bucket && prevLambda.hash !== config.hash) {
                    this.context.status(`Uploading code`);
                    this.context.instance.debug(
                        `Uploading %o lambda code to bucket %o`,
                        config.name,
                        config.bucket
                    );

                    await deploymentBucket.upload({ name: config.bucket, file: config.zipPath });
                    await updateLambdaCode({ lambda, ...config });
                } else if (!config.bucket && prevLambda.hash !== config.hash) {
                    this.context.status(`Uploading code`);
                    this.context.instance.debug(`Uploading %o lambda code.`, config.name);
                    await updateLambdaCode({ lambda, ...config });
                }
                this.context.status(`Updating`);
                this.context.instance.debug(`Updating %o lambda config.`, config.name);

                await updateLambdaConfig({ lambda, ...config });
            }
        }

        if (this.state.name && this.state.name !== config.name) {
            this.context.status(`Replacing %o with %o`, this.state.name, config.name);
            await deleteLambda({ lambda, name: this.state.name });
        }

        this.context.instance.debug(
            `Successfully deployed lambda %o in the %o region.`,
            config.name,
            config.region
        );

        const outputs = pick(outputsList, config);

        this.state = outputs;
        await this.save();

        return outputs;
    }

    async remove() {
        this.context.status(`Removing`);

        if (!this.state.name) {
            this.context.instance.debug(`Aborting removal. Function name not found in state.`);
            return;
        }

        const { name, region } = this.state;

        const lambda = new AwsSdkLambda({
            region,
            credentials: this.context.credentials.aws
        });

        const awsIamRole = await this.load("@serverless/aws-iam-role");
        const layer = await this.load("@serverless/aws-lambda-layer");

        await awsIamRole.remove();
        await layer.remove();

        this.context.instance.debug(`Removing lambda %o from the %o region.`, name, region);
        await deleteLambda({ lambda, name });
        this.context.instance.debug(
            `Successfully removed lambda %o from the %o region.`,
            name,
            region
        );

        const outputs = pick(outputsList, this.state);

        this.state = {};
        await this.save();

        return outputs;
    }
}

module.exports = AwsLambda;
