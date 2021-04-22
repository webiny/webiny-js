const IAM = require("aws-sdk/clients/iam");
const ora = require("ora");
const { green } = require("chalk");

module.exports = {
    type: "hook-before-deploy",
    name: "hook-before-deploy-es-service-role",
    async hook({ projectApplication }, context) {
        if (projectApplication.name !== "api") {
            return;
        }

        const spinner = new ora();
        spinner.start(`Checking Elastic Search service role...`);
        const iam = new IAM();
        try {
            await iam
                .getRole({ RoleName: "AWSServiceRoleForAmazonElasticsearchService" })
                .promise();

            spinner.stop({
                symbol: green("✔"),
                text: `Found Elastic Search service role!`
            });
            context.success(`Found Elastic Search service role!`);
        } catch (err) {
            spinner.text = "Creating Elastic Search service role...";

            try {
                await iam.createServiceLinkedRole({ AWSServiceName: "es.amazonaws.com" }).promise();

                spinner.stop();
            } catch (err) {
                spinner.fail(err.message);
                process.exit(1);
            }
        }
    }
};
