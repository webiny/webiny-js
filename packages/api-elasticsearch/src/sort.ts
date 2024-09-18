import WebinyError from "@webiny/error";
import { FieldSortOptions, SortOrder, SortType } from "~/types";
import { ElasticsearchFieldPlugin } from "~/plugins";

const sortRegExp = new RegExp(/^([a-zA-Z-0-9_@]+)_(ASC|DESC)$/);

interface CreateSortParams {
    sort: string[];
    defaults?: {
        field?: string;
        order?: SortOrder;
        unmappedType?: string;
    };
    fieldPlugins: Record<string, ElasticsearchFieldPlugin>;
}

export const createSort = (params: CreateSortParams): SortType => {
    const { sort, defaults, fieldPlugins } = params;
    if (!sort || sort.length === 0) {
        const { field, order, unmappedType } = defaults || {};
        /**
         * We say that our system defaults is always id since all records we create have some kind of primary ID.
         */
        return {
            [field || "id.keyword"]: {
                order: order || "desc",
                unmapped_type: unmappedType || undefined
            }
        };
    }
    /**
     * Cast as string because nothing else should be allowed yet.
     */
    const result = sort.reduce((acc, value) => {
        if (typeof value !== "string") {
            throw new WebinyError(`Sort as object is not supported..`);
        }
        const match = value.match(sortRegExp);

        if (!match) {
            throw new WebinyError(`Cannot sort by "${value}".`);
        }

        const [, field, initialOrder] = match;
        const order: SortOrder = initialOrder.toLowerCase() === "asc" ? "asc" : "desc";

        const plugin: ElasticsearchFieldPlugin =
            fieldPlugins[field] || fieldPlugins[ElasticsearchFieldPlugin.ALL];
        if (!plugin) {
            throw new WebinyError(`Missing plugin for the field "${field}"`, "PLUGIN_SORT_ERROR", {
                field
            });
        }
        /**
         * In case field plugin is the global one, change the * with actual field name.
         * Custom path methods will return their own values anyway so replacing * will not matter.
         */
        const path = plugin.getPath(field);

        acc[path] = plugin.getSortOptions(order);

        return acc;
    }, {} as Record<string, FieldSortOptions>);
    /**
     * If we do not have id in the sort, we add it as we need a tie_breaker for the Elasticsearch to be able to sort consistently.
     */
    if (!result["id.keyword"] && !result["id"]) {
        result["id.keyword"] = {
            order: "asc"
        };
    }
    return result;
};
