import WebinyError from "@webiny/error";
import { getLastAddedIndexPlugin } from "@webiny/api-elasticsearch";
import { PageElasticsearchIndexPlugin } from "~/plugins";
import { PbContext } from "~/types";
import { ElasticsearchIndexRequestBody } from "@webiny/api-elasticsearch/types";

export interface ConfigurationsElasticsearch {
    index: string;
}

export interface ConfigurationsElasticsearchParams {
    tenant: string;
    locale: string;
}

export interface ConfigurationsIndexSettingsParams {
    context: PbContext;
    locale: string;
}

export interface Configurations {
    es: (params: ConfigurationsElasticsearchParams) => ConfigurationsElasticsearch;
    indexSettings: (
        params: ConfigurationsIndexSettingsParams
    ) => Partial<ElasticsearchIndexRequestBody>;
}

export const configurations: Configurations = {
    es: params => {
        const { tenant, locale } = params;
        if (!tenant) {
            throw new WebinyError(
                `Missing "tenant" parameter when trying to create Elasticsearch index name.`,
                "TENANT_ERROR"
            );
        }
        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";

        const tenantId = sharedIndex ? "root" : tenant;
        let localeCode: string | null = null;
        if (process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE === "true") {
            if (!locale) {
                throw new WebinyError(
                    `Missing "locale" parameter when trying to create Elasticsearch index name.`,
                    "LOCALE_ERROR"
                );
            }
            localeCode = locale;
        }

        const index = [tenantId, localeCode, "page-builder"]
            .filter(Boolean)
            .join("-")
            .toLowerCase();

        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (!prefix) {
            return {
                index
            };
        }
        return {
            index: prefix + index
        };
    },
    indexSettings: ({ context, locale }) => {
        const plugin = getLastAddedIndexPlugin<PageElasticsearchIndexPlugin>({
            container: context.plugins,
            type: PageElasticsearchIndexPlugin.type,
            locale
        });

        return plugin ? plugin.body : {};
    }
};
