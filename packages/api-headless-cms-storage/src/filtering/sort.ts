import type { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import * as dotProp from "dot-prop";
import lodashSortBy from "lodash/sortBy.js";
import { extractSort } from "./fields/extractSort.js";
import type { Field } from "./fields/types.js";
import type { PluginsContainer } from "@webiny/plugins";

interface Params<T extends CmsEntryValues = CmsEntryValues> {
    model: CmsModel;
    items: CmsEntry<T>[];
    sort?: string[];
    fields: Record<string, Field>;
    plugins: PluginsContainer;
}

interface SortedItem {
    id: string;
    value: any;
}

export const sort = <T extends CmsEntryValues = CmsEntryValues>(
    params: Params<T>
): CmsEntry<T>[] => {
    const { model, items, sort = [], fields, plugins } = params;
    if (items.length <= 1) {
        return items;
    } else if (sort.length === 0) {
        sort.push("savedOn_DESC");
    } else if (sort.length > 1) {
        throw new WebinyError(
            "Sorting is limited to a single field.",
            "SORT_MULTIPLE_FIELDS_ERROR",
            {
                sort
            }
        );
    }
    const [firstSort] = sort;
    if (!firstSort) {
        throw new WebinyError("Empty sort array item.", "SORT_EMPTY_ERROR", {
            sort
        });
    }

    const { fieldId, field, valuePath, reverse } = extractSort({
        model,
        sortBy: firstSort,
        fields,
        plugins
    });

    const itemsToSort = items.map(item => {
        return {
            id: item.id,
            value: field.transform(dotProp.getProperty(item, valuePath))
        };
    });
    const sortedItems: SortedItem[] = lodashSortBy(itemsToSort, "value");
    const newItems = sortedItems.map(s => {
        const item = items.find(i => i.id === s.id);
        if (item) {
            return item;
        }
        /* This is impossible to happen because sorting items does not remove the items. BUT, we need to have this check just in case for development purposes. */
        throw new WebinyError(
            "Could not find item by given id after the sorting.",
            "SORTING_ITEMS_ERROR",
            {
                id: s.id,
                sortingBy: fieldId,
                reverse
            }
        );
    });
    if (!reverse) {
        return newItems;
    }
    return newItems.reverse();
};
