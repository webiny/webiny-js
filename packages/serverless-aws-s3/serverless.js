const { mergeDeepRight } = require("ramda");
const { Component } = require("@webiny/serverless-component");
const {
    getClients,
    clearBucket,
    accelerateBucket,
    deleteBucket,
    ensureBucket,
    configureCors,
    setNotificationConfiguration
} = require("./utils");

const defaults = {
    name: undefined,
    accelerated: true,
    region: "us-east-1"
};

class AwsS3 extends Component {
    async default(inputs = {}) {
        const config = mergeDeepRight(defaults, inputs);

        config.name = inputs.name || this.state.name || this.context.instance.resourceId();

        this.context.instance.debug(`Deploying bucket %o in region %o`, config.name, config.region);

        const clients = getClients(config.region);
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

        this.state.name = config.name;
        this.state.region = config.region;
        this.state.accelerated = config.accelerated;
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
}

module.exports = AwsS3;
