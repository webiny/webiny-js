import WebinyError from "@webiny/error";
import { getElasticsearchIndexPrefix, isSharedElasticsearchIndex } from "@webiny/api-elasticsearch";

export interface EsGetIndexNameParams {
    tenant: string;
    locale: string;
    type: string;
    isHeadlessCmsModel?: boolean;
}

export const esGetIndexName = (params: EsGetIndexNameParams) => {
    const { tenant, locale, type, isHeadlessCmsModel } = params;

    if (!type) {
        throw new WebinyError(
            `Missing "type" parameter when trying to create Elasticsearch index name.`,
            "INDEX_TYPE_ERROR"
        );
    }

    if (!tenant) {
        throw new WebinyError(
            `Missing "tenant" parameter when trying to create Elasticsearch index name.`,
            "TENANT_ERROR"
        );
    }

    const sharedIndex = isSharedElasticsearchIndex();

    const tenantId = sharedIndex ? "root" : tenant;
    let localeCode: string | null = null;
    if (isHeadlessCmsModel || process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE === "true") {
        if (!locale) {
            throw new WebinyError(
                `Missing "locale" parameter when trying to create Elasticsearch index name.`,
                "LOCALE_ERROR"
            );
        }
        localeCode = locale;
    }

    const index = [tenantId, isHeadlessCmsModel && "headless-cms", localeCode, type]
        .filter(Boolean)
        .join("-")
        .toLowerCase();

    const prefix = getElasticsearchIndexPrefix();
    if (!prefix) {
        return index;
    }
    return prefix + index;
};
