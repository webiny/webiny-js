import { createApiApp } from "@webiny/serverless-cms-aws";

export default createApiApp({
    elasticSearch: true,
    prefixPulumiResources: "wby-"
});
