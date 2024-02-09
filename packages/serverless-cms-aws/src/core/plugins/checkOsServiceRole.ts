import { IAM } from "@webiny/aws-sdk/client-iam";
import ora from "ora";
import { green } from "chalk";
import { CliContext } from "@webiny/cli/types";

const NO_SUCH_ENTITY_IAM_ERROR = "NoSuchEntity";

export const checkOsServiceRole = {
    type: "hook-before-deploy",
    name: "hook-before-deploy-es-service-role",
    async hook(params: Record<string, any>, context: CliContext) {
        const spinner = ora();
        spinner.start(`Checking Amazon OpenSearch service role...`);
        const iam = new IAM();
        try {
            await iam.getRole({ RoleName: "AWSServiceRoleForAmazonOpenSearchService" });

            spinner.stopAndPersist({
                symbol: green("✔"),
                text: `Found Amazon OpenSearch service role!`
            });
            context.success(`Found Amazon OpenSearch service role!`);
        } catch (err) {
            // We've seen cases where the `iam.getRole` call fails because of an issue
            // other than not being able to retrieve the service role. Let's print
            // additional info if that's the case. Will make debugging a bit easier.
            if (err.code !== NO_SUCH_ENTITY_IAM_ERROR) {
                spinner.fail(
                    "Tried retrieving Amazon OpenSearch service role but failed with the following error: " +
                        err.message
                );
                context.debug(err);
                process.exit(1);
            }

            spinner.text = "Creating Amazon OpenSearch service role...";

            try {
                await iam.createServiceLinkedRole({ AWSServiceName: "es.amazonaws.com" });

                spinner.stop();
            } catch (err) {
                spinner.fail(err.message);
                context.debug(err);
                process.exit(1);
            }
        }
    }
};
