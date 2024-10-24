import { createReactAppConfig, ReactAppConfigModifier } from "~/createReactAppConfig";
import { ApiOutput } from "@webiny/pulumi-aws";

// @ts-expect-error Rewrite CLI into TypeScript.
import { log, sleepSync } from "@webiny/cli/utils";

export const createAdminAppConfig = (modifier?: ReactAppConfigModifier) => {
    return createReactAppConfig(baseParams => {
        const { config, options } = baseParams;

        config.customEnv(env => ({
            ...env,
            PORT: process.env.PORT || 3001,
            WEBINY_ADMIN_ENV: options.env,
            WEBINY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS: process.env
                .WEBINY_TRASH_BIN_RETENTION_PERIOD_DAYS as string
        }));

        config.pulumiOutputToEnv<ApiOutput>("apps/api", ({ output, env }) => {
            if (!output) {
                log.warning(
                    `Could not assign required environment variables. %s project application's stack output could not be retrieved. Learn more: https://webiny.link/missing-stack-output`,
                    "API"
                );

                // We want to wait a bit because Webpack output just quickly hides the warning message.
                sleepSync(5000);

                return env;
            }

            return {
                ...env,
                REACT_APP_USER_POOL_REGION: output.region,
                REACT_APP_GRAPHQL_API_URL: `${output.apiUrl}/graphql`,
                REACT_APP_API_URL: output.apiUrl,
                REACT_APP_USER_POOL_ID: output.cognitoUserPoolId,
                REACT_APP_USER_POOL_WEB_CLIENT_ID: output.cognitoAppClientId,
                REACT_APP_USER_POOL_PASSWORD_POLICY: JSON.stringify(
                    output.cognitoUserPoolPasswordPolicy
                ),
                REACT_APP_WEBSOCKET_URL: output.websocketApiUrl
            };
        });

        if (modifier) {
            modifier(baseParams);
        }
    });
};

/**
 * Inject REACT_APP_USER_POOL_DOMAIN from the `core` app output into the `admin` app bundle.
 * The Cognito user pool domain is taken from the `cognitoUserPoolDomain` Pulumi app output.
 */
export const configureAdminCognitoUserPoolDomain: ReactAppConfigModifier = modifier => {
    modifier.config.pulumiOutputToEnv("apps/core", ({ env, output }) => {
        return {
            ...env,
            REACT_APP_USER_POOL_DOMAIN: output["cognitoUserPoolDomain"]
        };
    });
};
