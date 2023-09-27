import { createApiApp } from "@webiny/serverless-cms-aws";

export default createApiApp({
    pulumiResourceNamePrefix: "wby-",
    pulumi: ({ resources }) => {
        resources.graphql.functions.graphql.config.memorySize(1024);
    }
});
