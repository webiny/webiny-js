import { createReactAppConfig, ReactAppConfigModifier } from "~/createReactAppConfig";
import { ApiOutput } from "@webiny/pulumi-aws";

export const createAdminAppConfig = (modifier?: ReactAppConfigModifier) => {
    return createReactAppConfig(baseParams => {
        const { config } = baseParams;

        config.customEnv(env => ({ ...env, PORT: 3001 }));

        config.pulumiOutputToEnv<ApiOutput>("apps/api", ({ output, env }) => {
            return {
                ...env,
                REACT_APP_USER_POOL_REGION: output.region,
                REACT_APP_GRAPHQL_API_URL: `${output.apiUrl}/graphql`,
                REACT_APP_API_URL: output.apiUrl,
                REACT_APP_USER_POOL_ID: output.cognitoUserPoolId,
                REACT_APP_USER_POOL_WEB_CLIENT_ID: output.cognitoAppClientId,
                REACT_APP_USER_POOL_PASSWORD_POLICY: JSON.stringify(
                    output.cognitoUserPoolPasswordPolicy
                )
            };
        });

        if (modifier) {
            modifier(baseParams);
        }
    });
};
