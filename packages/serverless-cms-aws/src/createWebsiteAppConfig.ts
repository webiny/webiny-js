import { createReactAppConfig, ReactAppConfigModifier } from "~/createReactAppConfig";

export const createWebsiteAppConfig = (modifier?: ReactAppConfigModifier) => {
    return createReactAppConfig(baseParams => {
        const { config } = baseParams;

        config.customEnv(env => ({ ...env, PORT: 3000 }));

        config.pulumiOutputToEnv("apps/api", {
            REACT_APP_GRAPHQL_API_URL: "${apiUrl}/graphql",
            REACT_APP_API_URL: "${apiUrl}"
        });

        if (modifier) {
            modifier(baseParams);
        }
    });
};
