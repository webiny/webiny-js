import { Tenant } from "@webiny/api-tenancy/types";

interface ElasticsearchConfigParams {
    tenant: Tenant;
}

export default {
    db: {
        table: process.env.DB_TABLE_FORM_BUILDER,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    },
    esDb: {
        table: process.env.DB_TABLE_ELASTICSEARCH,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    },
    es(params: ElasticsearchConfigParams) {
        const { tenant } = params;

        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        const index = `${sharedIndex ? "root" : tenant.id}-form-builder`;

        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};
