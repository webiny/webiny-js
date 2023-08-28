const IAM = require("aws-sdk/clients/iam");
const ora = require("ora");
const { green } = require("chalk");

const NO_SUCH_ENTITY_IAM_ERROR = "NoSuchEntity";

module.exports = {
    type: "hook-before-deploy",
    name: "hook-before-deploy-es-service-role",
    async hook({ projectApplication }, context) {
        if (projectApplication.id !== "api") {
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
            // We've seen cases where the `iam.getRole` call fails because of an issue
            // other than not being able to retrieve the service role. Let's print
            // additional info if that's the case. Will make debugging a bit easier.
            if (err.code !== NO_SUCH_ENTITY_IAM_ERROR) {
                spinner.fail(
                    "Tried retrieving Elastic Search service role but failed with the following error: " +
                        err.message
                );
                context.debug(err);
                process.exit(1);
            }

            spinner.text = "Creating Elastic Search service role...";

            try {
                await iam.createServiceLinkedRole({ AWSServiceName: "es.amazonaws.com" }).promise();

                spinner.stop();
            } catch (err) {
                spinner.fail(err.message);
                context.debug(err);
                process.exit(1);
            }
        }
    }
};
