const { Component } = require("@serverless/core");
const get = require("lodash.get");
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
const path = require("path");

const PAGE_BUILDER_INSTALLATION_FILES_ZIP_KEY = "page_builder_installation_files.zip";

class ServerlessPageBuilder extends Component {
    async default(inputs = {}) {
        const { plugins = [], env, files, ...rest } = inputs;

        // Create S3 bucket for storing installation ZIP file.
        const { region } = rest;
        const s3Component = await this.load("@serverless/aws-s3");
        const s3Output = await s3Component({
            name: `webiny-serverless-page-builder-${this.context.instance.id}`,
            region
        });

        // Save installation files in the created bucket.
        const s3 = new S3({ region });

        try {
            await s3
                .getObject({ Bucket: s3Output.name, Key: PAGE_BUILDER_INSTALLATION_FILES_ZIP_KEY })
                .promise();
        } catch (e) {
            this.context.instance.debug(
                `Uploading Page Builder installation files to bucket %o`,
                s3Output.name
            );
            await s3
                .putObject({
                    Bucket: s3Output.name,
                    Key: PAGE_BUILDER_INSTALLATION_FILES_ZIP_KEY,
                    Body: fs.readFileSync(
                        path.join(
                            __dirname,
                            "installation",
                            PAGE_BUILDER_INSTALLATION_FILES_ZIP_KEY
                        )
                    )
                })
                .promise();
        }

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const output = await apolloService({
            plugins,
            env: {
                ...env,
                FILES_API_URL: get(files, "api.graphqlUrl"),
                PAGE_BUILDER_S3_BUCKET: s3Output.name,
                PAGE_BUILDER_INSTALLATION_FILES_ZIP_KEY
            },
            ...rest
        });

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        await apolloService.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessPageBuilder;
