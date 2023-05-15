import { createCoreApp } from "@webiny/serverless-cms-aws";

// Here we're listing all environments that will use the shared ElasticSearch domain.
const ENVIRONMENTS_USING_SHARED_ES_DOMAIN = ["staging", "prod"];

export default createCoreApp({
    pulumiResourceNamePrefix: "wby-",
    elasticSearch: ({ params }) => {
        const { env } = params.run;
        if (ENVIRONMENTS_USING_SHARED_ES_DOMAIN.includes(env)) {
            return {
                domainName: "my-elastic-search-shared-domain",
                indexPrefix: `${env}_`
            };
        }

        return undefined;
    }
});
