import { Tenant } from "@webiny/api-tenancy/types";

interface ElasticsearchConfigParams {
    tenant: string;
}

export default {
    es(params: ElasticsearchConfigParams) {
        const { tenant } = params;

        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        const index = `${sharedIndex ? "root" : tenant}-form-builder`;

        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};
