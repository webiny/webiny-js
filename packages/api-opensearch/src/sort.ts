import WebinyError from "@webiny/error";
import type { FieldSortOptions, SortOrder, SortType } from "~/types.js";
import {
    OpenSearchField,
    OpenSearchFieldAll
} from "~/features/OpenSearchField/abstractions/OpenSearchField.js";

const sortRegExp = /^((?:values\.)?[a-zA-Z0-9_@-]+)_(ASC|DESC)$/;

interface CreateSortParams {
    sort: string[];
    defaults?: {
        field?: string;
        order?: SortOrder;
        unmappedType?: string;
    };
    fieldPlugins: Record<string, OpenSearchField.Interface>;
}

export const createSort = (params: CreateSortParams): SortType => {
    const { sort, defaults, fieldPlugins } = params;
    if (!sort || sort.length === 0) {
        const { field, order, unmappedType } = defaults || {};
        return {
            [field || "id.keyword"]: {
                order: order || "desc",
                unmapped_type: (unmappedType || undefined) as any
            }
        };
    }
    const result = sort.reduce(
        (acc, value) => {
            if (typeof value !== "string") {
                throw new WebinyError(`Sort as object is not supported..`);
            }
            const match = value.match(sortRegExp);

            if (!match) {
                throw new WebinyError(`Cannot sort by "${value}".`);
            }

            const [, field, initialOrder] = match;
            const order: SortOrder = initialOrder.toLowerCase() === "asc" ? "asc" : "desc";

            const plugin: OpenSearchField.Interface =
                fieldPlugins[field] || fieldPlugins[OpenSearchFieldAll];
            if (!plugin) {
                throw new WebinyError(
                    `Missing plugin for the field "${field}"`,
                    "PLUGIN_SORT_ERROR",
                    {
                        field
                    }
                );
            }
            const path = plugin.getPath(field);

            acc[path] = plugin.getSortOptions(order);

            return acc;
        },
        {} as Record<string, FieldSortOptions>
    );
    if (!result["id.keyword"] && !result["id"]) {
        result["id.keyword"] = {
            order: "asc"
        };
    }
    return result;
};
