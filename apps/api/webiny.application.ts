import { createApiApp } from "@webiny/serverless-cms-aws";

export default createApiApp({
    pulumiResourceNamePrefix: "wby-",
    elasticSearch: ({ params }) => {
        if (params.run.env !== "staging" || params.run.env !== "prod") {
            return {
                domainName: "wby-elastic-search",
                indexPrefix: "wby-"
            };
        }

        return true;
    }
});
