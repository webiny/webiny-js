import { CoreBeforeDeploy, UiService } from "@webiny/project/abstractions/index.js";
import { GracefulError } from "@webiny/project";
import { IAM } from "@webiny/aws-sdk/client-iam/index.js";

const NO_SUCH_ENTITY_IAM_ERROR = "NoSuchEntity";

class EnsureOsServiceRoleBeforeCoreDeployImpl implements CoreBeforeDeploy.Interface {
    constructor(private uiService: UiService.Interface) {}

    async execute() {
        const iam = new IAM();
        try {
            await iam.getRole({ RoleName: "AWSServiceRoleForAmazonOpenSearchService" });
            // Role exists, proceed silently
        } catch (err) {
            // We've seen cases where the `iam.getRole` call fails because of an issue
            // other than not being able to retrieve the service role.
            if (err.Error?.Code !== NO_SUCH_ENTITY_IAM_ERROR) {
                throw GracefulError.from(
                    new Error("Failed to retrieve Amazon OpenSearch service role."),
                    [
                        "An unexpected error occurred while checking for the %s service role:",
                        "%s",
                        "",
                        "Please check your AWS IAM permissions and try again."
                    ].join("\n"),
                    "AWSServiceRoleForAmazonOpenSearchService",
                    err.message
                );
            }

            // Role doesn't exist, try to create it
            try {
                await iam.createServiceLinkedRole({
                    AWSServiceName: "opensearchservice.amazonaws.com"
                });
                // Created successfully, proceed silently
            } catch (err) {
                throw GracefulError.from(
                    new Error("Failed to create Amazon OpenSearch service role."),
                    [
                        "Could not create the required %s service role:",
                        "%s",
                        "",
                        "Your options:",
                        "• Ensure your AWS account has the necessary IAM permissions to create service-linked roles.",
                        "• Manually create the service role using the AWS console or CLI.",
                        "• Contact your AWS administrator for assistance."
                    ].join("\n"),
                    "AWSServiceRoleForAmazonOpenSearchService",
                    err.message
                );
            }
        }
    }
}

export const EnsureOsServiceRoleBeforeCoreDeploy = CoreBeforeDeploy.createImplementation({
    implementation: EnsureOsServiceRoleBeforeCoreDeployImpl,
    dependencies: [UiService]
});
