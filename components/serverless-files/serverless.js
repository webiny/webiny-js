const { join } = require("path");
const { configureS3, configureApiGateway } = require("./components");
const { Component } = require("@serverless/core");

/**
 * This component needs to deploy:
 * - S3 bucket
 * - API GW for /graphql, /read, /upload
 */
class FilesComponent extends Component {
    async default(input = {}) {
        const { bucket = "webiny-files", ...rest } = input;
        const plugins = ["@webiny/api-files/plugins"];

        // Create S3 bucket for storing files.
        const s3 = await this.load("@serverless/aws-s3");
        const s3Output = await s3({ name: bucket });
        await configureS3(s3Output);

        const lambda0 = await this.load("@serverless/function", "image-processor");
        const lambda0Result = await lambda0({
            name: "Files component - image processor",
            timeout: 10,
            code: join(__dirname, "build/fileProcessors/images"),
            handler: "handler.handler",
            description: "Performs various tasks on image files like e.g. image optimization or image resizing.",
            env: {
                S3_BUCKET: bucket
            }
        });

        // Deploy read/upload lambdas
        const lambda1 = await this.load("@serverless/function", "download");
        const readFn = await lambda1({
            name: "Files component - download files",
            timeout: 10,
            code: join(__dirname, "build", "download"),
            handler: "handler.handler",
            description: "Serves previously uploaded files.",
            env: {
                S3_BUCKET: bucket,
                IMAGE_PROCESSOR_LAMBDA_NAME: lambda0Result.name
            }
        });

        const lambda2 = await this.load("@serverless/function", "upload");
        const uploadFn = await lambda2({
            name: "Files component - upload files",
            timeout: 10,
            code: join(__dirname, "build", "upload"),
            handler: "handler.handler",
            description: "Returns pre-signed POST data for client-side file uploads.",
            env: {
                S3_BUCKET: bucket
            }
        });

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const apolloOutput = await apolloService({
            plugins,
            extraEndpoints: [
                { path: "/files/{path}", method: "ANY", function: readFn.arn },
                { path: "/files", method: "ANY", function: uploadFn.arn }
            ],
            ...rest
        });

        await configureApiGateway(apolloOutput.api);

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

    async remove(input = {}) {
        // TODO: remove all created resources
    }
}

module.exports = FilesComponent;
