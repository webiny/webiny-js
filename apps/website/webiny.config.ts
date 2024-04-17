import { createReactAppConfig } from "@webiny/serverless-cms-aws";

export default createReactAppConfig(({ config }) => {
    config.customEnv(env => {
        return {
            ...env,
            PORT: 3000,
            REACT_APP_GRAPHQL_API_URL: "https://d37misg6rf0j8v.cloudfront.net/graphql",
            REACT_APP_API_URL: "https://d37misg6rf0j8v.cloudfront.net",
            REACT_APP_WEBSITE_USER_POOL_REGION: "eu-central-1",
            REACT_APP_WEBSITE_USER_POOL_ID: "eu-central-1_TfTumHnD3",
            REACT_APP_WEBSITE_USER_POOL_CLIENT: "6uiftnlbolh3hevrqeu6sdftld"
        };
    });
});
