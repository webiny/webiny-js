import { CustomCoreOutput } from "@demo/pulumi";
import { ReactAppConfig } from "@webiny/serverless-cms-aws";

export const applyWebsiteConfig = (config: ReactAppConfig) => {
    // Add custom ENV variables to the build process using the new Cognito User Pool.
    config.pulumiOutputToEnv<CustomCoreOutput>("apps/core", ({ env, output }) => {
        return {
            ...env,
            REACT_APP_WEBSITE_USER_POOL_REGION: output.websiteUserPoolRegion,
            REACT_APP_WEBSITE_USER_POOL_ID: output.websiteUserPoolId,
            REACT_APP_WEBSITE_USER_POOL_CLIENT: output.websiteUserPoolClient
        };
    });
};
