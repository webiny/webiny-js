const STS = require("aws-sdk/clients/sts");

module.exports = {
    type: "hook-before-deploy",
    name: "hook-before-deploy-aws-credentials",
    async hook() {
        const sts = new STS();
        try {
            await sts.getCallerIdentity({}).promise();
        } catch (err) {
            console.log("Looks like your AWS credentials are not configured correctly!");
            console.log(
                "To learn how to configure your AWS credentials, visit https://docs.webiny.com/docs/how-to-guides/deployment/configure-aws-credentials"
            );
            process.exit(1);
        }
    }
};
