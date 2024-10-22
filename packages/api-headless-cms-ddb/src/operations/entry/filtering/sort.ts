import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import dotProp from "dot-prop";
import lodashSortBy from "lodash/sortBy";
import { extractSort } from "./extractSort";
import { Field } from "./types";
import { PluginsContainer } from "@webiny/plugins";

interface Params {
    model: CmsModel;
    items: CmsEntry[];
    sort?: string[];
    fields: Record<string, Field>;
    plugins: PluginsContainer;
}

interface SortedItem {
    id: string;
    value: any;
}

export const sort = (params: Params): CmsEntry[] => {
    const { model, items, sort = [], fields, plugins } = params;
    if (items.length <= 1) {
        return items;
    } else if (sort.length === 0) {
        sort.push("savedOn_DESC");
    } else if (sort.length > 1) {
        throw new WebinyError(
            "Sorting is limited to a single field on DynamoDB only system.",
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
            value: field.transform(dotProp.get(item, valuePath))
        };
    });
    const sortedItems: SortedItem[] = lodashSortBy(itemsToSort, "value");
    const newItems = sortedItems.map(s => {
        const item = items.find(i => i.id === s.id);
        if (item) {
            return item;
        }
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
