import type { OpenSearchFieldFactory } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type {
    CmsEntryListParams,
    CmsEntryListWhere,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { createModelFields } from "./fields.js";
import { createFullTextSearchFields } from "./fullTextSearchFields.js";
import { createInitialQuery } from "./initialQuery.js";
import { applyFullTextSearch } from "./fullTextSearch.js";
import type { CmsEntryOpenSearchBodyModifier } from "~/features/CmsEntryOpenSearchBodyModifier/index.js";
import type { CmsEntryOpenSearchSortModifier } from "~/features/CmsEntryOpenSearchSortModifier/index.js";
import type { CmsEntryOpenSearchQueryModifier } from "~/features/CmsEntryOpenSearchQueryModifier/index.js";
import type { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import type { CmsEntryOpenSearchFullTextSearch } from "~/features/CmsEntryOpenSearchFullTextSearch/index.js";
import { createElasticsearchSort } from "./sort.js";
import type {
    PrimitiveValue,
    QueryDslBoolQuery as BoolQueryConfig,
    SearchBody
} from "@webiny/api-opensearch/types.js";
import { assignMinimumShouldMatchToQuery } from "./assignMinimumShouldMatchToQuery.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/features/graphql/index.js";
import { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex/index.js";
import type { CmsEntryOpenSearchExecFiltering } from "~/features/CmsEntryOpenSearchExecFiltering/index.js";
import type { CmsEntryOpenSearchFieldPathFactory } from "~/features/CmsEntryOpenSearchFieldPathFactory/index.js";

interface ICreateElasticsearchBodyParams {
    execFiltering: CmsEntryOpenSearchExecFiltering.Interface;
    fieldPathFactory: CmsEntryOpenSearchFieldPathFactory.Interface;
    model: CmsModel;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    bodyModifiers: CmsEntryOpenSearchBodyModifier.Interface[];
    sortModifiers: CmsEntryOpenSearchSortModifier.Interface[];
    queryModifiers: CmsEntryOpenSearchQueryModifier.Interface[];
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
    fullTextSearches: CmsEntryOpenSearchFullTextSearch.Interface[];
    fieldFactory: OpenSearchFieldFactory.Interface;
    params: Omit<CmsEntryListParams, "where" | "after"> & {
        where: CmsEntryListWhere;
        after?: PrimitiveValue[];
    };
}
export const createElasticsearchBody = ({
    execFiltering,
    fieldPathFactory,
    model,
    params,
    fieldRegistry,
    fieldIndexRegistry,
    bodyModifiers,
    sortModifiers,
    queryModifiers,
    valueSearchRegistry,
    fullTextSearches,
    fieldFactory
}: ICreateElasticsearchBodyParams): SearchBody => {
    const { fields, search: term, where, sort: initialSort, after, limit } = params;

    const modelFields = createModelFields({
        model,
        fieldRegistry,
        fieldIndexRegistry
    });

    const applicableQueryModifiers = queryModifiers.filter(m => {
        return !m.modelId || m.modelId === model.modelId;
    });
    const applicableSortModifiers = sortModifiers.filter(
        m => !m.modelId || m.modelId === model.modelId
    );
    const applicableBodyModifiers = bodyModifiers.filter(m => {
        return !m.modelId || m.modelId === model.modelId;
    });

    const fullTextSearchFields = createFullTextSearchFields({
        fields: modelFields,
        term,
        targets: fields
    });

    const query = createInitialQuery({
        where,
        model
    });

    applyFullTextSearch({
        model,
        fullTextSearches,
        query,
        term,
        fields: fullTextSearchFields
    });

    execFiltering.execute({
        model,
        fields: modelFields,
        where,
        query
    });

    for (const modifier of applicableQueryModifiers) {
        modifier.modifyQuery({ query, model, where });
    }

    const sort = createElasticsearchSort({
        sort: initialSort,
        modelFields,
        model,
        fieldPathFactory,
        valueSearchRegistry,
        fieldFactory
    });

    for (const modifier of applicableSortModifiers) {
        modifier.modifySort({
            sort,
            model
        });
    }

    const boolQuery: BoolQueryConfig = {
        must: query.must.length > 0 ? query.must : undefined,
        must_not: query.must_not.length > 0 ? query.must_not : undefined,
        should: query.should.length > 0 ? query.should : undefined,
        filter: query.filter.length > 0 ? query.filter : undefined
    };

    assignMinimumShouldMatchToQuery({
        query: boolQuery
    });

    const body: SearchBody = {
        query: {
            bool: boolQuery
        },
        sort,
        size: (limit || 0) + 1,
        search_after: after,
        track_total_hits: true
    };

    for (const modifier of applicableBodyModifiers) {
        modifier.modifyBody({
            body,
            model,
            where
        });
    }

    return body;
};
