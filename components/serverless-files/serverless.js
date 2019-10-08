const { join } = require("path");
const { Component } = require("@serverless/core");
const { configureS3Bucket, configureApiGateway } = require("./components");
const { trackComponent } = require("@webiny/tracking");

/**
 * This component needs to deploy:
 * - S3 bucket
 * - API GW for /graphql, /read, /upload
 */
class FilesComponent extends Component {
    async default({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component: __dirname });

        const { region = "us-east-1", bucket = "webiny-files", env, ...rest } = inputs;
        const plugins = ["@webiny/api-files/plugins"];

        const manageFilesLambda = await this.load("@serverless/function", "manageFiles");
        const manageFilesLambdaOutput = await manageFilesLambda({
            name: "Files component - manage S3 objects",
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
        const apolloOutput = await apolloService({
            track: false,
            plugins,
            endpoints: [
                { path: "/files/{path}", method: "ANY", function: downloadLambdaOutput.arn }
            ],
            env: { ...env, S3_BUCKET: bucket },
            ...rest
        });

        await configureApiGateway({ region, apolloOutput, component: this });

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

    async remove({ track } = {}) {
        await trackComponent({
            track,
            context: this.context,
            component: __dirname,
            method: "remove"
        });
        // TODO: remove all created resources
    }
}

module.exports = FilesComponent;
