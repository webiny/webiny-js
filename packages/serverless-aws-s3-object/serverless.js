const { Component } = require("@webiny/serverless-component");
const S3 = require("aws-sdk/clients/s3");
const { uploadObject, createContentHash } = require("./utils");

class ServerlessAwsS3Object extends Component {
    async default(inputs = {}) {
        const { region, bucket, object } = inputs;
        const s3 = new S3({ region });
        const contentHash = await createContentHash(object.source);

        if (contentHash === this.state.hash) {
            this.context.instance.debug(`Object content was not changed. Skipping upload.`);
            return this.state.output;
        }

        if (this.state.hash) {
            this.context.instance.debug(`Object content was changed since last upload.`);
        }

        await uploadObject({ s3, bucket, ...object }, this.context);

        this.state.bucket = bucket;
        this.state.region = region;
        this.state.object = object;
        this.state.hash = contentHash;
        this.state.output = { key: object.key };
        await this.save();

        return this.state.output;
    }

    async remove() {
        if (!this.state.object || !this.state.object.key) {
            return;
        }

        const s3 = new S3({ region: this.state.region });

        // Check that bucket exists
        try {
            await s3.headBucket({ Bucket: this.state.bucket }).promise();
        } catch (e) {
            // If bucket doesn't exist, it was most likely deleted.
            this.state = {};
            await this.save();
            return;
        }

        this.context.instance.debug(
            "Removing object %o from %o",
            this.state.object.key,
            this.state.bucket
        );

        let Marker;
        while (true) {
            const { Contents, IsTruncated } = await s3
                .listObjects({
                    Bucket: this.state.bucket,
                    Prefix: this.state.object.key,
                    Marker
                })
                .promise();

            if (!Contents.length) {
                break;
            }

            await s3
                .deleteObjects({
                    Bucket: this.state.bucket,
                    Delete: { Objects: Contents.map(obj => ({ Key: obj.Key })) }
                })
                .promise();

            if (!IsTruncated) {
                break;
            }

            Marker = Contents[Contents.length - 1].Key;
        }

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessAwsS3Object;
