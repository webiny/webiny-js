const { Component } = require("@webiny/serverless-component");
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
const path = require("path");

const INSTALLATION_FILES_ZIP_KEY = "page_builder_installation_files.zip";

class ServerlessPageBuilderInstallation extends Component {
    async default(inputs = {}) {
        // Create S3 bucket for storing installation ZIP file.
        const { region } = inputs;
        const s3Component = await this.load("@serverless/aws-s3");
        const s3Output = await s3Component({
            name: `${this.context.instance.id}-webiny-page-builder-installation`.replace(/_/g, "-"),
            region
        });

        // Save installation files in the created bucket.
        const s3 = new S3({ region });

        try {
            await s3
                .getObject({ Bucket: s3Output.name, Key: INSTALLATION_FILES_ZIP_KEY })
                .promise();
        } catch (e) {
            this.context.instance.debug(
                `Uploading Page Builder installation files to bucket %o`,
                s3Output.name
            );
            await s3
                .putObject({
                    Bucket: s3Output.name,
                    Key: INSTALLATION_FILES_ZIP_KEY,
                    Body: fs.readFileSync(
                        path.join(__dirname, "installation", INSTALLATION_FILES_ZIP_KEY)
                    )
                })
                .promise();
        }

        this.state.output = {
            bucketName: s3Output.name,
            archiveKey: INSTALLATION_FILES_ZIP_KEY
        };
        await this.save();

        return this.state.output;
    }

    async remove() {
        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessPageBuilderInstallation;
