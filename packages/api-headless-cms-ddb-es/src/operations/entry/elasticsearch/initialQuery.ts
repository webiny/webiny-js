import WebinyError from "@webiny/error";
import type { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types.js";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { createLatestRecordType, createPublishedRecordType } from "../recordType.js";
import { isSharedElasticsearchIndex } from "@webiny/api-elasticsearch";

export const createBaseQuery = (): ElasticsearchBoolQueryConfig => {
    return {
        must: [],
        must_not: [],
        should: [],
        filter: []
    };
};

interface Params {
    model: CmsModel;
    where: CmsEntryListWhere;
}
/**
 * Latest and published are specific in Elasticsearch to that extend that they are tagged in the __type property.
 * We allow either published or either latest.
 * Latest is used in the manage API and published in the read API.
 *
 *
 * We add the query.filter terms because we do not need scored search here and it is a bit faster.
 */
export const createInitialQuery = (params: Params): ElasticsearchBoolQueryConfig => {
    const { model, where } = params;

    const query = createBaseQuery();

    /**
     * When ES index is shared between tenants, we need to filter records by tenant ID
     *
     * TODO determine if we want to search across tenants in shared index?
     */
    const sharedIndex = isSharedElasticsearchIndex();
    if (sharedIndex) {
        /**
         * Tenant for the filtering is taken from the model.
         *
         * TODO determine if we want to send it in the "where" parameter?
         */
        query.filter.push({
            term: {
                "tenant.keyword": model.tenant
            }
        });
        /**
         * Also, we must search only in selected model.
         */
        query.filter.push({
            term: {
                "modelId.keyword": model.modelId
            }
        });
    }

    /**
     * We must transform published and latest where args into something that is understandable by our Elasticsearch
     */
    if (where.published === true) {
        query.filter.push({
            term: {
                "__type.keyword": createPublishedRecordType()
            }
        });
    } else if (where.latest === true) {
        query.filter.push({
            term: {
                "__type.keyword": createLatestRecordType()
            }
        });
    }
    //
    /**
     * We do not allow filtering without the published or latest parameter.
     * Also, we do not want to set the default one, as there is a large possibility for user error when filtering.
     */
    else {
        throw new WebinyError(
            `Cannot call Elasticsearch query when not setting "published" or "latest".`,
            "OPENSEARCH_UNSUPPORTED_QUERY",
            {
                where
            }
        );
    }
    /**
     * We need to remove fields that actually do not exist on the record - it will break otherwise.
     * This will modify the original object, which is what we want.
     */
    delete where.published;
    delete where.latest;

    return query;
};
