import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryListParams, CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types";
import { createModelFields } from "./fields";
import { createSearchPluginList } from "./plugins/search";
import { createFullTextSearchFields } from "./fullTextSearchFields";
import { createInitialQuery } from "./initialQuery";
import { applyFullTextSearch } from "./fullTextSearch";
import { createOperatorPluginList } from "./plugins/operator";
import { applyFiltering } from "./filtering";
import { createQueryModifierPluginList } from "./plugins/queryModifier";
import { createSortModifierPluginList } from "./plugins/sortModifier";
import { createBodyModifierPluginList } from "./plugins/bodyModifier";
import { SearchBody } from "elastic-ts";
import { createElasticsearchSort } from "./sort";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";

interface Params {
    plugins: PluginsContainer;
    model: CmsModel;
    params: Omit<CmsEntryListParams, "where" | "after"> & {
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
     * We need the search plugins as key -> plugin value, so it is easy to find plugin we need, without iterating through array.
     */
    const searchPlugins = createSearchPluginList({
        plugins
    });
    /**
     * We need the operator plugins, which we execute on our where conditions.
     */
    const operatorPlugins = createOperatorPluginList({
        plugins,
        locale: model.locale
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
     * We need the fields which we can search through via the full text search.
     *
     */
    const fullTextSearchFields = createFullTextSearchFields({
        model,
        term,
        fields
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
        query,
        term,
        fields: fullTextSearchFields
    });

    applyFiltering({
        fields: modelFields,
        searchPlugins,
        operatorPlugins,
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
        model,
        searchPlugins
    });

    for (const pl of sortModifierPlugins) {
        pl.modifySort({
            sort,
            model
        });
    }

    const body: SearchBody = {
        query: {
            bool: {
                must: query.must.length > 0 ? query.must : undefined,
                must_not: query.must_not.length > 0 ? query.must_not : undefined,
                should: query.should.length > 0 ? query.should : undefined,
                filter: query.filter.length > 0 ? query.filter : undefined
            }
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
