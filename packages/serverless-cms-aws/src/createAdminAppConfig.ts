import { createReactAppConfig, ReactAppConfigModifier } from "~/createReactAppConfig";

export const createAdminAppConfig = (modifier?: ReactAppConfigModifier) => {
    return createReactAppConfig(baseParams => {
        const { config } = baseParams;

        config.customEnv(env => ({ ...env, PORT: 3001 }));

        config.pulumiOutputToEnv("apps/api", {
            REACT_APP_USER_POOL_REGION: "${region}",
            REACT_APP_GRAPHQL_API_URL: "${apiUrl}/graphql",
            REACT_APP_API_URL: "${apiUrl}",
            REACT_APP_USER_POOL_ID: "${cognitoUserPoolId}",
            REACT_APP_USER_POOL_WEB_CLIENT_ID: "${cognitoAppClientId}",
            REACT_APP_USER_POOL_PASSWORD_POLICY: "${cognitoUserPoolPasswordPolicy}"
        });

        if (modifier) {
            modifier(baseParams);
        }
    });
};
