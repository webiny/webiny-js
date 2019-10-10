const { join } = require("path");
const { Component } = require("@serverless/core");
const { configureS3Bucket, configureApiGateway } = require("./components");
const { trackComponent } = require("@webiny/tracking");

/**
 * This component deploys:
 * - S3 bucket for file storage
 * - API GW with "/files/{key}" route
 * - Three functions:
 *  - manage files - when a file is deleted, this makes sure all other related files are deleted too
 *  - download files - handles file download and calls image transformer if needed
 *  - image transformer - performs various image transformations
 */
class FilesComponent extends Component {
    async default({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component: __dirname });

        const { region = "us-east-1", bucket = "webiny-files", env, ...rest } = inputs;

        const manageFilesLambda = await this.load("@serverless/function", "manage-files");
        const manageFilesLambdaOutput = await manageFilesLambda({
            name: "Files component - manage files",
            timeout: 10,
            code: join(__dirname, "dist/functions/manageFiles"),
            handler: "handler.handler",
            description: "Triggered once a file was deleted.",
            env: {
                S3_BUCKET: bucket
            }
        });

        // Create S3 bucket for storing files.
        const s3 = await this.load("@serverless/aws-s3");
        const s3Output = await s3({ name: bucket });
        await configureS3Bucket({
            component: this,
            s3Output,
            manageFilesLambdaOutput,
            region,
            bucket
        });

        const imageTransformerLambda = await this.load("@serverless/function", "image-transformer");
        const imageTransformerLambdaOutput = await imageTransformerLambda({
            name: "Files component - image transformer",
            timeout: 10,
            code: join(__dirname, "dist/functions/imageTransformer"),
            handler: "handler.handler",
            description:
                "Performs various tasks on image files like e.g. image optimization or image resizing.",
            env: {
                S3_BUCKET: bucket
            }
        });

        // Deploy read/upload lambdas
        const downloadLambda = await this.load("@serverless/function", "download");
        const downloadLambdaOutput = await downloadLambda({
            name: "Files component - download files",
            timeout: 10,
            code: join(__dirname, "dist/functions/downloadFile"),
            handler: "handler.handler",
            description: "Serves previously uploaded files.",
            env: {
                S3_BUCKET: bucket,
                IMAGE_TRANSFORMER_LAMBDA_NAME: imageTransformerLambdaOutput.name
            }
        });

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const apolloServiceOutput = await apolloService({
            track: false,
            plugins: ["@webiny/api-files/plugins"],
            endpoints: [
                { path: "/files/{path}", method: "ANY", function: downloadLambdaOutput.arn }
            ],
            env: { ...env, S3_BUCKET: bucket },
            ...rest
        });

        await configureApiGateway({ region, apolloOutput: apolloServiceOutput, component: this });

        const output = {
            api: apolloServiceOutput.api,
            s3: s3Output,
            cdnOrigin: {
                url: apolloServiceOutput.api.url,
                pathPatterns: {
                    "/files/{path}": {
                        ttl: 2592000 // 1 month
                    }
                }
            }
        };

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove({ track } = {}) {
        await trackComponent({
            track,
            context: this.context,
            component: __dirname,
            method: "remove"
        });

        const apolloService = await this.load("@webiny/serverless-apollo-service");
        await apolloService.remove();

        let lambda = await this.load("@serverless/function", "manage-files");
        await lambda.remove();

        lambda = await this.load("@serverless/function", "image-transformer");
        await lambda.remove();

        lambda = await this.load("@serverless/function", "download");
        await lambda.remove();

        const s3 = await this.load("@serverless/aws-s3");
        await s3.remove();

        this.state = {};
        await this.save();
    }
}

module.exports = FilesComponent;
