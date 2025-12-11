import { CoreBeforeDeploy, UiService } from "@webiny/project/abstractions/index.js";
import { getStackOutput, GracefulError } from "@webiny/project";

interface ICoreStackOutput {
    elasticsearchDomainEndpoint?: string;
    elasticsearchDomainArn?: string;
    [key: string]: any;
}

class EnsureOsWasDeployedImpl implements CoreBeforeDeploy.Interface {
    constructor(private uiService: UiService.Interface) {}

    async execute(params: CoreBeforeDeploy.Params) {
        // Get the stack output from the core application
        const output = await getStackOutput<ICoreStackOutput>(params);

        // If there's no output, core hasn't been deployed yet, so we can proceed.
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
                "Cannot redeploy core without OpenSearch when it was previously deployed with it."
            ),
            [
                "Cannot deploy with %s enabled!",
                "The core application was previously deployed %s OpenSearch.",
                "Once a deployment method is chosen (%s or %s),",
                "you cannot switch between them.",
                "Solution:",
                "- If you want to use OpenSearch, you need to redeploy the entire project from scratch.",
                "- If you want to continue without OpenSearch, disable it in your project configuration."
            ].join("\n"),
            "OpenSearch",
            "WITHOUT",
            "DynamoDB-only",
            "DynamoDB+OpenSearch"
        );
    }
}

export const EnsureOsWasDeployed = CoreBeforeDeploy.createImplementation({
    implementation: EnsureOsWasDeployedImpl,
    dependencies: [UiService]
});
