import { ApiPulumiApp } from "@webiny/pulumi-aws";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

export const applyWebsiteEnvVariables = (app: ApiPulumiApp) => {
    const core = getStackOutput({
        folder: "apps/core",
        env: app.params.run["env"]
    });

    if (!core) {
        throw new Error("Core application is not deployed.");
    }

    app.setCommonLambdaEnvVariables({
        WEBSITE_COGNITO_REGION: core["websiteUserPoolRegion"],
        WEBSITE_COGNITO_USER_POOL_ID: core["websiteUserPoolId"]
    });

    // Add permission to GraphQL Lambda policy to interact with the Website User Pool
    app.resources.graphql.policy.config.policy(policy => {
        if (typeof policy === "string") {
            return policy;
        }

        return {
            ...policy,
            Statement: [
                ...policy.Statement,
                {
                    Sid: "PermissionForWebsiteCognitoUserPool",
                    Effect: "Allow",
                    Action: "cognito-idp:*",
                    Resource: `${core["websiteUserPoolArn"]}`
                }
            ]
        };
    });
};
