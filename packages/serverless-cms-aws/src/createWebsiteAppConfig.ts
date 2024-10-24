import { createReactAppConfig, ReactAppConfigModifier } from "~/createReactAppConfig";
import { ApiOutput } from "@webiny/pulumi-aws";

// @ts-expect-error Rewrite CLI into TypeScript.
import { log, sleepSync } from "@webiny/cli/utils";

export const createWebsiteAppConfig = (modifier?: ReactAppConfigModifier) => {
    return createReactAppConfig(baseParams => {
        const { config, options } = baseParams;

        config.customEnv(env => ({
            ...env,
            PORT: process.env.PORT || 3000,
            WEBINY_WEBSITE_ENV: options.env
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
                REACT_APP_GRAPHQL_API_URL: `${output.apiUrl}/graphql`,
                REACT_APP_API_URL: output.apiUrl
            };
        });

        if (modifier) {
            modifier(baseParams);
        }
    });
};
