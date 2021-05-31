import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

// By default, we only deploy "prod" stack when the WEBINY_ENV is equal to "prod". But do note that it's
// recommended to we deploy both application code and cloud infrastructure resources into staging environments
// as well. For cost reasons, by default, this is disabled, but feel free to add "staging" if needed.
// https://www.webiny.com/docs/key-topics/ci-cd/environments/staging-prod-deployments
const PROD_STACK_ENVIRONMENTS = ["prod" /*"staging"*/];

export = async () => {
    // Add tags to all resources that support tagging.
    tagResources({
        WbyProjectName: process.env.WEBINY_PROJECT_NAME as string,
        WbyEnvironment: process.env.WEBINY_ENV as string
    });

    const environment = process.env.WEBINY_ENV as string;
    if (PROD_STACK_ENVIRONMENTS.includes(environment)) {
        // Import "prod" resources config and initialize resources.
        return await import("./prod").then(module => module.default());
    }

    // Import "dev" resources config and initialize resources.
    return await import("./dev").then(module => module.default());
};
