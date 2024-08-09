import { createReactAppConfig, ReactAppConfigModifier } from "~/createReactAppConfig";
import { ApiOutput } from "@webiny/pulumi-aws";
import tailwindcss from "tailwindcss";

// @ts-expect-error No types available for this package yet.
import { traverseLoaders } from "@webiny/project-utils/traverseLoaders";

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

        /**
         * Add Tailwind loader to webpack configuration.
         */
        config.webpack(config => {
            traverseLoaders(config.module?.rules, (loader: any) => {
                if (loader.loader && loader.loader.includes("postcss-loader")) {
                    loader.options.postcssOptions.plugins = [
                        ...loader.options.postcssOptions.plugins(),
                        tailwindcss({ config: require.resolve("@webiny/admin/tailwind.config") })
                    ];
                }
            });

            return config;
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
