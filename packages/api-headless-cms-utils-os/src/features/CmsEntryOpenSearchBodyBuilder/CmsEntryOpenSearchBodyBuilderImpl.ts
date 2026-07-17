import type { SearchBody } from "@webiny/api-opensearch/types.js";
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
import { createElasticsearchBody } from "~/operations/entry/elasticsearch/body.js";
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
        return createElasticsearchBody({
            execFiltering: this.execFiltering,
            fieldPathFactory: this.fieldPathFactory,
            model: params.model,
            fieldRegistry: this.fieldRegistry,
            fieldIndexRegistry: this.fieldIndexRegistry,
            bodyModifiers: this.bodyModifiers,
            sortModifiers: this.sortModifiers,
            queryModifiers: this.queryModifiers,
            valueSearchRegistry: this.valueSearchRegistry,
            fullTextSearches: this.fullTextSearches,
            fieldFactory: this.fieldFactory,
            params: params.params
        });
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
