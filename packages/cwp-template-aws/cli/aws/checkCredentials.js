const STS = require("aws-sdk/clients/sts");
const { green, red } = require("chalk");

module.exports = {
    type: "hook-before-deploy",
    name: "hook-before-deploy-aws-credentials",
    async hook() {
        process.env.AWS_SDK_LOAD_CONFIG = "true";

        // Check if AWS credentials are configured
        const sts = new STS();
        const config = sts.config;

        try {
            await sts.getCallerIdentity({}).promise();
        } catch (err) {
            console.log(
                [
                    "",
                    red("  Looks like your AWS credentials are not configured correctly!"),
                    "  To learn how to configure your AWS credentials, visit https://docs.webiny.com/docs/guides/aws-credentials",
                    ""
                ].join("\n")
            );
            process.exit(1);
        }

        const { profile } = config.credentials;

        if (!config.region) {
            console.log(
                [
                    "",
                    red("  You must define an AWS Region to deploy to!"),
                    "  Either define an AWS_REGION environment variable, or configure a region for your AWS profile:",
                    "  https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html",
                    ""
                ].join("\n")
            );
            process.exit(1);
        }

        // We assign the region to the appropriate ENV variable for easier access in the stack definition files.
        process.env.AWS_REGION = config.region;

        console.log(`💡 Using profile ${green(profile)} in ${green(config.region)} region.`);
    }
};
