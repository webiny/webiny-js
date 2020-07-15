const AwsSdkLambda = require("aws-sdk/clients/lambda");
const { mergeDeepRight, pick } = require("ramda");
const { Component } = require("@webiny/serverless-component");
const { utils } = require("@serverless/core");
const pRetry = require("p-retry");

const PRETRY_ARGS = { retries: 3 };

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
    "arn",
    "layers",
    "region",
    "permissions"
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
    region: "us-east-1",
    permissions: [],
    layers: []
};

class AwsLambda extends Component {
    async default(inputs = {}) {
        this.context.instance.status(`Deploying`);

        const config = mergeDeepRight(defaults, inputs);

        config.name = this.state.name || this.context.instance.getResourceName(config.name);

        this.context.instance.debug(
            `Starting deployment of lambda %o to the %o region.`,
            config.name,
            config.region
        );

        const lambda = new AwsSdkLambda({ region: config.region });

        const awsIamRole = await this.load("@webiny/serverless-aws-iam-role");

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
            config.role = outputsAwsIamRole.arn;
        }

        this.context.instance.status("Packaging");
        this.context.instance.debug(`Packaging lambda code from %o`, config.code);
        config.zipPath = await pack(config.code, config.shims);

        config.hash = await utils.hashFile(config.zipPath);

        let deploymentBucket;
        if (config.bucket) {
            deploymentBucket = await this.load("@webiny/serverless-aws-s3");
        }

        const prevLambda = await getLambda({ lambda, ...config });

        if (!prevLambda) {
            if (config.bucket) {
                this.context.instance.debug(
                    `Uploading %o lambda package to bucket %o.`,
                    config.name,
                    config.bucket
                );
                this.context.instance.status(`Uploading`);

                await deploymentBucket.upload({ name: config.bucket, file: config.zipPath });
            }

            this.context.instance.status(`Creating`);
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
                    this.context.instance.status(`Uploading code`);
                    this.context.instance.debug(
                        `Uploading %o lambda code to bucket %o`,
                        config.name,
                        config.bucket
                    );

                    await deploymentBucket.upload({ name: config.bucket, file: config.zipPath });
                    await updateLambdaCode({ lambda, ...config });
                } else if (!config.bucket && prevLambda.hash !== config.hash) {
                    this.context.instance.status(`Uploading code`);
                    this.context.instance.debug(`Uploading %o lambda code.`, config.name);
                    await updateLambdaCode({ lambda, ...config });
                }
                this.context.instance.status(`Updating`);
                this.context.instance.debug(`Updating %o lambda config.`, config.name);

                await updateLambdaConfig({ lambda, ...config });
            }
        }

        if (this.state.name && this.state.name !== config.name) {
            this.context.instance.status(`Replacing %o with %o`, this.state.name, config.name);
            await deleteLambda({ lambda, name: this.state.name });
        }

        // Create permissions if they don't exist in the current state
        if (config.permissions) {
            for (let i = 0; i < config.permissions.length; i++) {
                const permission = config.permissions[i];

                const permissionExist =
                    Array.isArray(this.state.permissions) &&
                    this.state.permissions.find(prm => prm.StatementId === permission.StatementId);

                if (permissionExist) {
                    continue;
                }

                if (!permission.FunctionName) {
                    permission.FunctionName = config.name;
                }
                this.context.instance.debug(
                    `Adding %o permission to %o`,
                    permission.Action,
                    permission.FunctionName
                );
                await pRetry(() => {
                    lambda.addPermission(permission).promise();
                }, PRETRY_ARGS);
            }
        }

        // Remove permissions if they no longer exist in the inputs
        if (Array.isArray(this.state.permissions)) {
            for (let i = 0; i < this.state.permissions.length; i++) {
                const permission = this.state.permissions[i];

                const permissionExist = config.permissions.find(
                    prm => prm.StatementId === permission.StatementId
                );

                if (permissionExist) {
                    continue;
                }

                this.context.instance.debug(
                    `Removing %o permission from %o`,
                    permission.Action,
                    permission.FunctionName
                );
                await pRetry(() => {
                    lambda
                        .removePermission({
                            FunctionName: permission.FunctionName,
                            StatementId: permission.StatementId
                        })
                        .promise();
                }, PRETRY_ARGS);
            }
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
        this.context.instance.status(`Removing`);

        if (!this.state.name) {
            this.context.instance.debug(`Aborting removal. Function name not found in state.`);
            return;
        }

        const { name, region } = this.state;

        const lambda = new AwsSdkLambda({ region });

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
