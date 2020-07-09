const STS = require("aws-sdk/clients/sts");

module.exports = {
    type: "hook-before-deploy",
    name: "hook-before-deploy-aws-credentials",
    async hook() {
        // check AWS credentials
        const sts = new STS();
        try {
            await sts.getCallerIdentity({}).promise();
        } catch (err) {
            console.log("Looks like your AWS credentials are not configured correctly!");
            console.log(
                "Check the AWS credentials documentation: https://docs.webiny.com/docs/guides/aws-credentials/"
            );
            process.exit(1);
        }
    }
};
