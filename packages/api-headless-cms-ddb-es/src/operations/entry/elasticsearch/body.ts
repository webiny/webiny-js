import { PluginsContainer } from "@webiny/plugins";
import {
    CmsEntryListWhere,
    type CmsEntryStorageOperationsListParams,
    CmsModel
} from "@webiny/api-headless-cms/types";
import { createModelFields } from "./fields";
import { createInitialQuery } from "./initialQuery";
import { applyFullTextSearch } from "./fullTextSearch";
import { createQueryModifierPluginList } from "./plugins/queryModifier";
import { createSortModifierPluginList } from "./plugins/sortModifier";
import { createBodyModifierPluginList } from "./plugins/bodyModifier";
import { createElasticsearchSort } from "./sort";
import { BoolQueryConfig, PrimitiveValue, SearchBody } from "@webiny/api-elasticsearch/types";
import { createExecFiltering } from "./filtering";
import { assignMinimumShouldMatchToQuery } from "./assignMinimumShouldMatchToQuery";

interface Params {
    plugins: PluginsContainer;
    model: CmsModel;
    params: Omit<CmsEntryStorageOperationsListParams, "where" | "after"> & {
        where: CmsEntryListWhere;
        after?: PrimitiveValue[];
    };
}
export const createElasticsearchBody = ({ plugins, model, params }: Params): SearchBody => {
    const { fields, search: term, where, sort: initialSort, after, limit } = params;
    /**
     * We need the model fields constructed as a key -> field value, so we do not need to iterate through array when we require some field.
     */
    const modelFields = createModelFields({
        plugins,
        model
    });

    /**
     * We need the query modifier plugins.
     */
    const queryModifierPlugins = createQueryModifierPluginList({
        plugins,
        model
    });
    /**
     * We need the sort modifier plugins.
     */
    const sortModifierPlugins = createSortModifierPluginList({
        plugins,
        model
    });
    /**
     * We need the body modifier plugins.
     */
    const bodyModifierPlugins = createBodyModifierPluginList({
        plugins,
        model
    });

    /**
     * The initial elasticsearch query where we attach some default conditions we always need.
     */
    const query = createInitialQuery({
        where,
        model
    });
    /**
     * Apply the full text search, if term is set.
     */
    applyFullTextSearch({
        model,
        plugins,
        query,
        term,
        fields
    });

    const execFiltering = createExecFiltering({
        model,
        fields: modelFields,
        plugins
    });

    execFiltering({
        where,
        query
    });

    for (const pl of queryModifierPlugins) {
        pl.modifyQuery({ query, model, where });
    }

    const sort = createElasticsearchSort({
        plugins,
        sort: initialSort,
        modelFields,
        model
    });

    for (const pl of sortModifierPlugins) {
        pl.modifySort({
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

    for (const pl of bodyModifierPlugins) {
        pl.modifyBody({
            body,
            model,
            where
        });
    }

    return body;
};
