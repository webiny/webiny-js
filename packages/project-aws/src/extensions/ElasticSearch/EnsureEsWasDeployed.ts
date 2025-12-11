import { CoreBeforeDeploy, UiService } from "@webiny/project/abstractions/index.js";
import { getStackOutput, GracefulError } from "@webiny/project";

interface ICoreStackOutput {
    elasticsearchDomainEndpoint?: string;
    elasticsearchDomainArn?: string;
    [key: string]: any;
}

class EnsureEsWasDeployedImpl implements CoreBeforeDeploy.Interface {
    constructor(private uiService: UiService.Interface) {}

    async execute(params: CoreBeforeDeploy.Params) {
        // Get the stack output from the core application
        const output = await getStackOutput<ICoreStackOutput>(params);

        // If there's no output, Core hasn't been deployed yet, so we can proceed.
        if (!output) {
            return;
        }

        // Check if `elasticsearchDomainEndpoint` exists in the output.
        // If it exists, Core was deployed with ElasticSearch and we can proceed.
        const hasElasticSearchDomain = !!output.elasticsearchDomainArn;
        if (hasElasticSearchDomain) {
            return;
        }

        // Core was previously deployed without ElasticSearch
        throw GracefulError.from(
            new Error(
                "Cannot deploy with ElasticSearch enabled. The Core application was previously deployed WITHOUT ElasticSearch."
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
            "DynamoDB+ElasticSearch",
            "ElasticSearch",
            "ElasticSearch",
            "webiny.config.tsx"
        );
    }
}

export const EnsureEsWasDeployed = CoreBeforeDeploy.createImplementation({
    implementation: EnsureEsWasDeployedImpl,
    dependencies: [UiService]
});
