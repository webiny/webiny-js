const { basename, dirname } = require("path");
const fs = require("fs");
const { mergeDeepRight } = require("ramda");
const { Component } = require("@webiny/serverless-component");
const {
    getClients,
    clearBucket,
    accelerateBucket,
    deleteBucket,
    uploadDir,
    packAndUploadDir,
    uploadFile,
    ensureBucket,
    configureCors,
    setNotificationConfiguration
} = require("./utils");

const defaults = {
    name: undefined,
    accelerated: true,
    region: "us-east-1"
};

function resolveFilePath(path) {
    if(!path.startsWith(".") && !path.startsWith("/")) {
        return require.resolve()
    }

    return path;
}

class AwsS3 extends Component {
    async default(inputs = {}) {
        const config = mergeDeepRight(defaults, inputs);

        config.name = inputs.name || this.state.name || this.context.instance.resourceId();

        this.context.instance.debug(`Deploying bucket %o in region %o`, config.name, config.region);

        const clients = getClients(this.context.instance.credentials.aws, config.region);
        await ensureBucket(clients.regular, config.name, this.context.instance.debug);

        if (config.accelerated) {
            this.context.instance.debug(
                `Setting acceleration to %o for bucket %o`,
                config.accelerated,
                config.name
            );
            await accelerateBucket(clients.regular, config.name, config.accelerated);
        }

        if (config.cors) {
            this.context.instance.debug(`Setting CORS for bucket %o`, config.name);
            await configureCors(
                clients.regular,
                config.name,
                config.cors,
                this.context.instance.debug
            );
        }

        if (config.notificationConfiguration) {
            this.context.instance.debug(
                `Setting notification configuration for bucket %o`,
                config.name
            );

            await setNotificationConfiguration(
                clients.regular,
                config.name,
                config.notificationConfiguration
            );
        }

        if (config.upload) {
            await this.upload({ bucket: config.name, region: config.region, files: config.upload });
        }

        this.state.name = config.name;
        this.state.region = config.region;
        this.state.accelerated = config.accelerated;
        this.state.deleteBucketOnRemove = config.deleteBucketOnRemove === true;
        this.state.notificationConfiguration = config.notificationConfiguration;
        this.state.url = `https://${config.name}.s3.amazonaws.com`;
        this.state.upload = config.upload;
        await this.save();

        this.context.instance.debug(
            `Bucket %o was successfully deployed to the %o region`,
            config.name,
            config.region
        );
        return this.state;
    }

    async remove() {
        if (!this.state.name) {
            this.context.instance.debug(`Nothing to remove; bucket name not found in state.`);
            return;
        }

        if (this.state.deleteBucketOnRemove !== true) {
            this.context.instance.debug(
                `%o is set to %o. Bucket will NOT be removed.`,
                "deleteBucketOnRemove",
                false
            );
            return;
        }

        const clients = getClients(this.context.instance.credentials.aws, this.state.region);

        this.context.instance.debug(`Clearing bucket %o contents.`, this.state.name);

        await clearBucket(
            this.state.accelerated ? clients.accelerated : clients.regular,
            this.state.name
        );

        this.context.instance.debug(
            `Deleting bucket %o from region %o.`,
            this.state.name,
            this.state.region
        );

        await deleteBucket(clients.regular, this.state.name);

        this.context.instance.debug(
            `Bucket %o was successfully deleted from region %o.`,
            this.state.name,
            this.state.region
        );

        const outputs = {
            name: this.state.name,
            region: this.state.region,
            accelerated: this.state.accelerated
        };

        this.state = {};
        await this.save();

        return outputs;
    }

    async upload({ bucket, region, files }) {
        this.context.instance.debug(`Starting upload to bucket %o in region %o`, bucket, region);

        const clients = getClients(this.context.instance.credentials.aws, region);

        for (let i = 0; i < files.length; i++) {
            const obj = files[i];

            resolveFilePath(obj);

            if (obj.dir && fs.existsSync(obj.dir)) {
                if (obj.zip) {
                    this.context.instance.debug(
                        `Packing and uploading directory %o to bucket %o`,
                        obj.dir,
                        bucket
                    );
                    // pack & upload using multipart uploads
                    const defaultKey = Math.random()
                        .toString(36)
                        .substring(6);

                    await packAndUploadDir({
                        s3: this.state.accelerated ? clients.accelerated : clients.regular,
                        bucketName: name,
                        dirPath: obj.dir,
                        key: obj.key || `${defaultKey}.zip`,
                        cacheControl: obj.cacheControl
                    });
                } else {
                    this.context.instance.debug(
                        `Uploading directory %o to bucket %o`,
                        obj.dir,
                        bucket
                    );
                    // upload directory contents
                    await uploadDir(
                        this.state.accelerated ? clients.accelerated : clients.regular,
                        name,
                        obj.dir,
                        obj.cacheControl,
                        { keyPrefix: obj.keyPrefix }
                    );
                }
            } else if (obj.file && fs.existsSync(obj.file)) {
                // upload a single file using multipart uploads
                this.context.instance.debug(`Uploading file %o to bucket %o`, obj.file, bucket);

                await uploadFile({
                    s3: this.state.accelerated ? clients.accelerated : clients.regular,
                    bucketName: name,
                    filePath: obj.file,
                    key: obj.key || basename(obj.file),
                    cacheControl: obj.cacheControl
                });

                this.context.instance.debug(
                    `File %o uploaded with key %o`,
                    obj.file,
                    obj.key || basename(obj.file)
                );
            }
        }
    }
}

module.exports = AwsS3;
