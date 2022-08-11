import { createReactAppConfig, ReactAppConfigModifier } from "~/createReactAppConfig";
import { ApiOutput } from "@webiny/pulumi-aws";

export const createWebsiteAppConfig = (modifier?: ReactAppConfigModifier) => {
    return createReactAppConfig(baseParams => {
        const { config } = baseParams;

        config.customEnv(env => ({ ...env, PORT: 3000 }));

        config.pulumiOutputToEnv<ApiOutput>("apps/api", ({ output, env }) => {
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
