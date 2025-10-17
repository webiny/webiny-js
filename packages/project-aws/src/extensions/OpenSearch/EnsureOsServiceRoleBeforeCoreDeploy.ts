import { createImplementation } from "@webiny/di-container";
import { CoreBeforeDeploy, UiService } from "@webiny/project/abstractions/index.js";
import ora from "ora";
import chalk from "chalk";
import { IAM } from "@webiny/aws-sdk/client-iam/index.js";

const { green } = chalk;

const NO_SUCH_ENTITY_IAM_ERROR = "NoSuchEntity";

class EnsureOsServiceRoleBeforeCoreDeploy implements CoreBeforeDeploy.Interface {
    constructor(private uiService: UiService.Interface) {}

    async execute() {
        const ui = this.uiService;

        const spinner = ora();
        spinner.start(`Checking Amazon OpenSearch service role...`);
        const iam = new IAM();
        try {
            await iam.getRole({ RoleName: "AWSServiceRoleForAmazonOpenSearchService" });

            spinner.stopAndPersist({
                symbol: green("✔"),
                text: `Found Amazon OpenSearch service role!`
            });
            ui.success(`Found Amazon OpenSearch service role!`);
        } catch (err) {
            // We've seen cases where the `iam.getRole` call fails because of an issue
            // other than not being able to retrieve the service role. Let's print
            // additional info if that's the case. Will make debugging a bit easier.
            if (err.Error?.Code !== NO_SUCH_ENTITY_IAM_ERROR) {
                spinner.fail(
                    "Tried retrieving Amazon OpenSearch service role but failed with the following error: " +
                        err.message
                );
                ui.debug(err);
                process.exit(1);
            }

            spinner.text = "Creating Amazon OpenSearch service role...";

            try {
                await iam.createServiceLinkedRole({
                    AWSServiceName: "opensearchservice.amazonaws.com"
                });

                spinner.stop();
            } catch (err) {
                spinner.fail(err.message);
                ui.debug(err);
                process.exit(1);
            }
        }
    }
}

export default createImplementation({
    abstraction: CoreBeforeDeploy,
    implementation: EnsureOsServiceRoleBeforeCoreDeploy,
    dependencies: [UiService]
});
