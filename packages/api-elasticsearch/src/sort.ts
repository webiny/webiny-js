import WebinyError from "@webiny/error";
import { FieldSortOptions, SortType, SortOrder } from "./types";
import { ElasticsearchFieldPlugin } from "./plugins/definition/ElasticsearchFieldPlugin";

const sortRegExp = new RegExp(/^([a-zA-Z-0-9_]+)_(ASC|DESC)$/);

export interface Params {
    sort: string[];
    defaults?: {
        field?: string;
        order?: SortOrder;
        unmappedType?: string;
    };
    fieldPlugins: Record<string, ElasticsearchFieldPlugin>;
}
export const createSort = (params: Params): SortType => {
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

    return sort.reduce((acc, value) => {
        const match = value.match(sortRegExp);

        if (!match) {
            throw new WebinyError(`Cannot sort by "${value}".`);
        }

        const [, field, initialOrder] = match;
        const order: SortOrder = initialOrder.toLowerCase() === "asc" ? "asc" : "desc";

        const plugin: ElasticsearchFieldPlugin = fieldPlugins[field] || fieldPlugins["*"];
        if (!plugin) {
            throw new WebinyError(`Missing plugin for the field "${field}"`, "PLUGIN_ERROR", {
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
};
