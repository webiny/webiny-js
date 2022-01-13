import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

// By default, we only deploy "prod" stack when the WEBINY_ENV environment variable is equal to "prod".
// But do note that it's recommended the same application code and cloud infrastructure resources are
// deployed into staging environments too (these should be as equal to the prod environment as possible).
// For cost reasons, by default this is disabled, but feel free to uncomment the "staging" environment.
// https://www.webiny.com/docs/key-topics/ci-cd/environments/staging-prod-deployments
const PROD_STACK_ENVIRONMENTS = ["prod" /*"staging"*/];

export = async () => {
    // Add tags to all resources that support tagging. Read more about the default environment variables:
    // https://www.webiny.com/docs/how-to-guides/environment-variables#webiny-environment-variables
    tagResources({
        WbyProjectName: String(process.env.WEBINY_PROJECT_NAME),
        WbyEnvironment: String(process.env.WEBINY_ENV)
    });

    const env = String(process.env.WEBINY_ENV);
    const envBase = getBaseEnv(env) ?? env;

    if (PROD_STACK_ENVIRONMENTS.includes(envBase)) {
        // Import "prod" resources config and initialize resources.
        return await import("./prod").then(module => module.default());
    }

    // Import "dev" resources config and initialize resources.
    return await import("./dev").then(module =>
        module.default({
            envBase
        })
    );
};

// TODO move to one of oure packages (used in admin deploy plugin also)
function getBaseEnv(env: string) {
    // matches strings like prod.v3
    const envRegex = /^(.*?)(\.(.+))$/i;
    const envMatch = envRegex.exec(env);
    if (!envMatch) {
        return null;
    }

    return envMatch[1];
}
