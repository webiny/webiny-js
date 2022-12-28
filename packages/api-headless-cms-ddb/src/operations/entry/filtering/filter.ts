import { CmsEntry, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import WebinyError from "@webiny/error";
import dotProp from "dot-prop";
import { PluginsContainer } from "@webiny/plugins";
import { Field, FilterItemFromStorage } from "./types";
import { createFullTextSearch } from "./fullTextSearch";
import { createFilters, ItemFilter } from "./createFilters";
import { transformValue } from "./transform";

interface ExecFilterParams {
    value: any;
    filter: ItemFilter;
}
const execFilter = (params: ExecFilterParams) => {
    const { value: plainValue, filter } = params;

    const value = transformValue({
        value: plainValue,
        transform: filter.transformValue
    });
    const matched = filter.plugin.matches({
        value,
        compareValue: filter.compareValue
    });
    if (filter.negate) {
        return matched === false;
    }
    return matched;
};

interface Params {
    items: CmsEntry[];
    where: Partial<CmsEntryListWhere>;
    plugins: PluginsContainer;
    fields: Record<string, Field>;
    fromStorage: FilterItemFromStorage;
    fullTextSearch?: {
        term?: string;
        fields?: string[];
    };
}

export const filter = async (params: Params): Promise<CmsEntry[]> => {
    const { items: records, where, plugins, fields, fromStorage, fullTextSearch } = params;

    const keys = Object.keys(where);
    if (keys.length === 0) {
        return records;
    }
    const filters = createFilters({
        plugins,
        where,
        fields
    });

    /**
     * No point in going further if there are no filters to be applied and no full text search to be executed.
     */
    if (filters.length === 0 && !fullTextSearch) {
        return records;
    }
    /**
     * We need the contains plugin to run the full text search.
     * TODO check out to maybe implement fuzzy search.
     */
    const fullTextSearchPlugin = plugins
        .byType<ValueFilterPlugin>(ValueFilterPlugin.type)
        .find(plugin => plugin.getOperation() === "contains");
    if (!fullTextSearchPlugin) {
        throw new WebinyError(
            `Missing "contains" plugin to run the full-text search.`,
            "MISSING_PLUGIN"
        );
    }

    const search = createFullTextSearch({
        ...fullTextSearch,
        plugin: fullTextSearchPlugin
    });

    const promises: Promise<CmsEntry | null>[] = records.map(async record => {
        /**
         * We need to go through all the filters and apply them to the given record.
         */
        for (const filter of filters) {
            /**
             * In case is multiple values field, last part is removed from path.
             * -> values.categories.id -> values.categories
             */
            // const valuePath = getFilterValuePath(filter);

            const rawValue = dotProp.get(record, filter.path);
            // if (valuePath !== filter.path) {
            //     /**
            //      * Calculated is different other than the original because we need to search in the array of objects.
            //      */
            //     const propertyPath = getFilterValuePropertyPath(filter);
            //     if (!propertyPath) {
            //         console.log(`Cannot determine the property path of "${filter.path}".`);
            //         continue;
            //     }
            //
            //     const plainValue = await fromStorage<Record<string, string>[]>(
            //         fields[filter.field.fieldId],
            //         rawValue
            //     );
            //     /**
            //      * We cannot go through the value because it is not array. Log the error and continue.
            //      */
            //     if (Array.isArray(plainValue) === false) {
            //         console.log(
            //             `Cannot go through the value on ${valuePath} because it is not an array, and we expect it to be.`
            //         );
            //         continue;
            //     }
            //     record = dotProp.set(record, valuePath, plainValue);
            //
            //     const values = plainValue.map(value => {
            //         return value[propertyPath];
            //     });
            //
            //     const result = execFilter({
            //         value: values,
            //         filter
            //     });
            //
            //     if (!result) {
            //         return null;
            //     }
            //     continue;
            // }

            const plainValue = await fromStorage(fields[filter.field.fieldId], rawValue);
            /**
             * If raw value is not same as the value after the storage transform, set the value to the items being filtered.
             */
            if (plainValue !== rawValue) {
                record = dotProp.set(record, filter.path, plainValue);
            }

            const result = execFilter({
                value: plainValue,
                filter
            });
            if (result === false) {
                return null;
            }
        }
        /**
         * If we have full text search defined, run it. Just return the given record if not full text search.
         */
        if (!search) {
            return record;
        }
        const result = await search({
            item: record,
            fromStorage,
            fields
        });
        if (!result) {
            return null;
        }

        return record;
    });

    /**
     * We run filtering as promises so it is a bit faster than in for ... of loop.
     */
    const results: (CmsEntry | null)[] = await Promise.all(promises);

    /**
     * And filter out the null values which are returned when filter is not satisfied.
     */
    return results.filter(Boolean) as CmsEntry[];
};
