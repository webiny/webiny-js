import type {
    QueryDslBoolQuery as BoolQueryConfig,
    SearchBody
} from "@webiny/api-opensearch/types.js";
import { OpenSearchFieldFactory } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex/index.js";
import { CmsEntryOpenSearchBodyModifier } from "~/features/CmsEntryOpenSearchBodyModifier/index.js";
import { CmsEntryOpenSearchSortModifier } from "~/features/CmsEntryOpenSearchSortModifier/index.js";
import { CmsEntryOpenSearchQueryModifier } from "~/features/CmsEntryOpenSearchQueryModifier/index.js";
import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import { CmsEntryOpenSearchFullTextSearch } from "~/features/CmsEntryOpenSearchFullTextSearch/index.js";
import { CmsEntryOpenSearchExecFiltering } from "~/features/CmsEntryOpenSearchExecFiltering/index.js";
import { CmsEntryOpenSearchFieldPathFactory } from "~/features/CmsEntryOpenSearchFieldPathFactory/index.js";
import { createModelFields } from "~/operations/entry/elasticsearch/fields.js";
import { createFullTextSearchFields } from "~/operations/entry/elasticsearch/fullTextSearchFields.js";
import { createInitialQuery } from "~/operations/entry/elasticsearch/initialQuery.js";
import { applyFullTextSearch } from "~/operations/entry/elasticsearch/fullTextSearch.js";
import { assignMinimumShouldMatchToQuery } from "~/operations/entry/elasticsearch/assignMinimumShouldMatchToQuery.js";
import { createElasticsearchSort } from "./sort.js";
import { CmsEntryOpenSearchBodyBuilder } from "./abstractions.js";

class CmsEntryOpenSearchBodyBuilderClass implements CmsEntryOpenSearchBodyBuilder.Interface {
    public constructor(
        private readonly execFiltering: CmsEntryOpenSearchExecFiltering.Interface,
        private readonly fieldPathFactory: CmsEntryOpenSearchFieldPathFactory.Interface,
        private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface,
        private readonly fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface,
        private readonly bodyModifiers: CmsEntryOpenSearchBodyModifier.Interface[],
        private readonly sortModifiers: CmsEntryOpenSearchSortModifier.Interface[],
        private readonly queryModifiers: CmsEntryOpenSearchQueryModifier.Interface[],
        private readonly valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface,
        private readonly fullTextSearches: CmsEntryOpenSearchFullTextSearch.Interface[],
        private readonly fieldFactory: OpenSearchFieldFactory.Interface
    ) {}

    public build(params: CmsEntryOpenSearchBodyBuilder.Params): SearchBody {
        const { model } = params;
        const { fields, search: term, where, sort: initialSort, after, limit } = params.params;

        const modelFields = createModelFields({
            model,
            fieldRegistry: this.fieldRegistry,
            fieldIndexRegistry: this.fieldIndexRegistry
        });

        const applicableQueryModifiers = this.queryModifiers.filter(m => {
            return !m.modelId || m.modelId === model.modelId;
        });
        const applicableSortModifiers = this.sortModifiers.filter(
            m => !m.modelId || m.modelId === model.modelId
        );
        const applicableBodyModifiers = this.bodyModifiers.filter(m => {
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
            fullTextSearches: this.fullTextSearches,
            query,
            term,
            fields: fullTextSearchFields
        });

        this.execFiltering.execute({
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
            fieldPathFactory: this.fieldPathFactory,
            valueSearchRegistry: this.valueSearchRegistry,
            fieldFactory: this.fieldFactory
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
    }
}

export const CmsEntryOpenSearchBodyBuilderImpl = CmsEntryOpenSearchBodyBuilder.createImplementation(
    {
        implementation: CmsEntryOpenSearchBodyBuilderClass,
        dependencies: [
            CmsEntryOpenSearchExecFiltering,
            CmsEntryOpenSearchFieldPathFactory,
            CmsModelFieldToGraphQLRegistry,
            CmsEntryOpenSearchFieldIndexRegistry,
            [CmsEntryOpenSearchBodyModifier, { multiple: true }],
            [CmsEntryOpenSearchSortModifier, { multiple: true }],
            [CmsEntryOpenSearchQueryModifier, { multiple: true }],
            CmsEntryOpenSearchValueSearchRegistry,
            [CmsEntryOpenSearchFullTextSearch, { multiple: true }],
            OpenSearchFieldFactory
        ]
    }
);
