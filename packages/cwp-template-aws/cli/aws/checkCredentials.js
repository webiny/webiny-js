const STS = require("aws-sdk/clients/sts");
const { green } = require("chalk");

module.exports = {
    type: "hook-before-deploy",
    name: "hook-before-deploy-aws-credentials",
    async hook(_, context) {
        process.env.AWS_SDK_LOAD_CONFIG = "true";

        // Check if AWS credentials are configured
        const sts = new STS();
        const config = sts.config;

        try {
            await sts.getCallerIdentity({}).promise();
        } catch (err) {
            console.log();
            context.error("Looks like your AWS credentials are not configured correctly!");
            context.info(
                "To learn how to configure your AWS credentials, visit https://www.webiny.com/docs/how-to-guides/deployment/aws/configure-aws-credentials"
            );
            console.log();
            process.exit(1);
        }

        const { profile } = config.credentials;

        if (!config.region) {
            console.log();
            context.error("You must define an AWS Region to deploy to!");
            context.info(
                "Either define an AWS_REGION environment variable, or configure a region for your AWS profile:"
            );
            context.info(
                "https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html"
            );
            console.log();
            process.exit(1);
        }

        // We assign the region to the appropriate ENV variable for easier access in the stack definition files.
        process.env.AWS_REGION = config.region;

        context.info(`Using profile ${green(profile)} in ${green(config.region)} region.`);
    }
};
