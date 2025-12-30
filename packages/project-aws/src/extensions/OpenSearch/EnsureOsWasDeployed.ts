import { CoreBeforeDeploy } from "@webiny/project/abstractions/index.js";
import { GracefulError } from "@webiny/project";
import { CoreStackOutputService } from "../../abstractions/index.js";

class EnsureOsWasDeployedImpl implements CoreBeforeDeploy.Interface {
    constructor(private coreStackOutputService: CoreStackOutputService.Interface) {}

    async execute() {
        // Get the stack output from the core application
        // CoreStackOutputService automatically uses env/variant/region from ProjectSdkParamsService
        const output = await this.coreStackOutputService.execute();

        // If there's no output, Core hasn't been deployed yet, so we can proceed.
        if (!output) {
            return;
        }

        // Check if `elasticsearchDomainEndpoint` exists in the output.
        // If it exists, core was deployed with OpenSearch and we can proceed.
        const hasOpenSearchDomain = !!output.elasticsearchDomainArn;
        if (hasOpenSearchDomain) {
            return;
        }

        // Core was previously deployed without OpenSearch
        throw GracefulError.from(
            new Error(
                "Cannot deploy with OpenSearch enabled. The Core application was previously deployed WITHOUT OpenSearch."
            ),
            [
                "Once a deployment method is chosen (%s or %s), you cannot switch between them.",
                "",
                "Your options:",
                "• If you want to use %s, you need to destroy and redeploy the entire project from scratch.",
                "• If you want to continue without %s, disable it in your %s config file.",
                "",
                "Learn more: https://webiny.link/deploy-diff-db-setup"
            ].join("\n"),
            "DynamoDB-only",
            "DynamoDB+OpenSearch",
            "OpenSearch",
            "OpenSearch",
            "webiny.config.tsx"
        );
    }
}

export const EnsureOsWasDeployed = CoreBeforeDeploy.createImplementation({
    implementation: EnsureOsWasDeployedImpl,
    dependencies: [CoreStackOutputService]
});
