const { STS } = require("@webiny/aws-sdk/client-sts");
const { green } = require("chalk");

module.exports = {
    type: "hook-before-deploy",
    name: "hook-before-deploy-aws-credentials",
    async hook(_, context) {
        process.env.AWS_SDK_LOAD_CONFIG = "true";

        // Check if AWS credentials are configured
        const sts = new STS();
        const config = sts.config;
        const region = await config.region();

        // With AWS-SDK v3, we can no longer read the loaded profile. We try to read if from env var instead.
        const profile = process.env.AWS_PROFILE || "default";

        try {
            await sts.getCallerIdentity({});
        } catch (err) {
            console.log();
            context.error("Looks like your AWS credentials are not configured correctly!");

            // Print the actual error if the debug mode has been enabled.
            context.debug(err);

            context.info(
                "To learn how to configure your AWS credentials, visit https://www.webiny.com/docs/how-to-guides/deployment/aws/configure-aws-credentials"
            );
            console.log();
            process.exit(1);
        }

        if (!region) {
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
        process.env.AWS_REGION = region;

        const { accessKeyId } = await config.credentials();

        if (profile) {
            context.info(`Using profile ${green(profile)} in ${green(region)} region.`);
        } else {
            context.info(`Using access key ID ${green(accessKeyId)} in ${green(region)} region.`);
        }
    }
};
