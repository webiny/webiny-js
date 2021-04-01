import { CmsContentModel, CmsContext, CmsDatabaseConfig } from "@webiny/api-headless-cms/types";
import baseConfigurations from "@webiny/api-headless-cms/configurations";

interface ElasticsearchConfig {
    index: string;
}

export default {
    ...baseConfigurations,
    esDb: (): CmsDatabaseConfig => ({
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
    es(context: CmsContext, model: CmsContentModel): ElasticsearchConfig {
        const tenant = context.security.getTenant();
        if (!tenant) {
            throw new Error(`There is no tenant on "context.security".`);
        }

        const locale = context.cms.getLocale().code;
        const index = `${tenant.id}-headless-cms-${locale}-${model.modelId}`.toLowerCase();
        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};
