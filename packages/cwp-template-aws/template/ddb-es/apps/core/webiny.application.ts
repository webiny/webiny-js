import { createCoreApp } from "@webiny/serverless-cms-aws";

export default createCoreApp({
    elasticSearch: true,
    pulumiResourceNamePrefix: "wby-"
});
