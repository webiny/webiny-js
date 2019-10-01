const { join } = require("path");
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

        // Create s3 bucket
        const s3 = await this.load("@serverless/aws-s3");
        const s3Output = s3({ name: bucket });

        // Deploy read/upload lambdas
        const lambda1 = await this.load("@serverless/function", "read");
        const readFn = await lambda1({
            timeout: 10,
            code: join(__dirname, "functions", "read"),
            handler: "handler.handler",
            description: "Read files",
            env: {
                BUCKET: s3Output.arn
            }
        });

        const lambda2 = await this.load("@serverless/function", "upload");
        const uploadFn = await lambda2({
            timeout: 10,
            code: join(__dirname, "build", "upload"),
            handler: "handler.handler",
            description: "Upload files",
            env: {
                BUCKET: s3Output.arn
            }
        });

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const apolloOutput = await apolloService({
            plugins,
            extraEndpoints: [
                { path: "/download", method: "GET", function: readFn.arn },
                { path: "/upload", method: "POST", function: uploadFn.arn }
            ],
            ...rest
        });

        const output = {
            api: apolloOutput.api,
            s3: s3Output,
            cdnOrigin: {
                url: apolloOutput.api.url,
                pathPatterns: {
                    // potweakaj kako ti pase
                    "/read": {
                        ttl: 60
                    }
                }
            }
        };

        console.log(output.api)

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(input = {}) {
        // TODO: remove all created resources
    }
}

module.exports = FilesComponent;
