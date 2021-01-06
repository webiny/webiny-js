const STS = require("aws-sdk/clients/sts");
const AWS = require("aws-sdk");
const { green, red } = require("chalk");

module.exports = {
    type: "hook-before-deploy",
    name: "hook-before-deploy-aws-credentials",
    async hook() {
        // Check if AWS credentials are configured
        const sts = new STS();
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

        // Check if region is set
        await new Promise(resolve => {
            AWS.config.getCredentials(err => {
                if (err) {
                    throw err;
                }
                resolve();
            });
        });

        const profile = AWS.config.credentials.profile;

        const region = process.env.AWS_REGION || AWS.config.region;

        if (!region) {
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

        process.env.AWS_REGION = region;

        console.log(`💡 Using profile ${green(profile)} in ${green(region)} region.`);
    }
};
