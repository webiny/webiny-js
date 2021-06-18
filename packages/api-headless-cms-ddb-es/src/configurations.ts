import { CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";

interface DatabaseConfigKeyFields {
    name: string;
}

interface DatabaseConfigKeys {
    primary: boolean;
    unique: boolean;
    name: string;
    fields: DatabaseConfigKeyFields[];
}

export interface CmsDatabaseConfig {
    table: string;
    keys: DatabaseConfigKeys[];
}

interface ElasticsearchConfig {
    index: string;
}

interface Configurations {
    db: () => CmsDatabaseConfig;
    esDb: () => CmsDatabaseConfig;
    es: (context: CmsContext, model: CmsContentModel) => ElasticsearchConfig;
}

const configurations: Configurations = {
    db: () => ({
        table: process.env.DB_TABLE_HEADLESS_CMS,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    }),
    esDb: () => ({
        table:
            process.env.DB_TABLE_HEADLESS_CMS_ELASTICSEARCH || process.env.DB_TABLE_ELASTICSEARCH,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    }),
    es(context, model) {
        const tenant = context.tenancy.getCurrentTenant();
        if (!tenant) {
            throw new Error(`There is no tenant on "context.security".`);
        }

        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        const locale = context.cms.getLocale().code;
        const index = [sharedIndex ? "root" : tenant.id, "headless-cms", locale, model.modelId]
            .join("-")
            .toLowerCase();

        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};

export default configurations;
