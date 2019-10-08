const { join } = require("path");
const { Component } = require("@serverless/core");
const { configureS3Bucket, configureApiGateway } = require("./components");

/**
 * This component needs to deploy:
 * - S3 bucket
 * - API GW for /graphql, /read, /upload
 */
class FilesComponent extends Component {
    async default(inputs = {}) {
        const { region = "us-east-1", bucket = "webiny-files", env, ...rest } = inputs;
        const plugins = ["@webiny/api-files/plugins"];

        const manageS3ObjectsLambda = await this.load("@serverless/function", "manageS3Objects");
        const manageS3ObjectsLambdaOutput = await manageS3ObjectsLambda({
            name: "Files component - manage S3 objects",
            timeout: 10,
            code: join(__dirname, "dist/manageS3Objects"),
            handler: "handler.handler",
            description: "Triggered once a file was deleted.",
            env: {
                S3_BUCKET: bucket
            }
        });

        // Create S3 bucket for storing files.
        const s3 = await this.load("./../../../node_modules/@serverless/aws-s3");
        const s3Output = await s3({ name: bucket });
        await configureS3Bucket({
            component: this,
            s3Output,
            manageS3ObjectsLambdaOutput,
            region,
            bucket
        });

        const imageProcessorLambda = await this.load("@serverless/function", "image-processor");
        const imageProcessorLambdaOutput = await imageProcessorLambda({
            name: "Files component - image processor",
            timeout: 10,
            code: join(__dirname, "dist/fileProcessors/images"),
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
            code: join(__dirname, "dist/download"),
            handler: "handler.handler",
            description: "Serves previously uploaded files.",
            env: {
                S3_BUCKET: bucket,
                IMAGE_PROCESSOR_LAMBDA_NAME: imageProcessorLambdaOutput.name
            }
        });

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const apolloOutput = await apolloService({
            plugins,
            endpoints: [
                { path: "/files/{path}", method: "ANY", function: downloadLambdaOutput.arn }
            ],
            env: { ...env, S3_BUCKET: bucket },
            ...rest
        });

        await configureApiGateway({ apolloOutput, component: this });

        const output = {
            api: apolloOutput.api,
            s3: s3Output,
            cdnOrigin: {
                url: apolloOutput.api.url,
                pathPatterns: {
                    // TODO: potweakaj kako ti pase
                    "/read": {
                        ttl: 60
                    }
                }
            }
        };

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        // TODO: remove all created resources
    }
}

module.exports = FilesComponent;
