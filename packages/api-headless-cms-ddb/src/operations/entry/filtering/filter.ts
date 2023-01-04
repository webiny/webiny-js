import { CmsEntry, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import WebinyError from "@webiny/error";
import { PluginsContainer } from "@webiny/plugins";
import { Field, FilterItemFromStorage } from "./types";
import { createFullTextSearch } from "./fullTextSearch";
import { createFilters, ItemFilter } from "./createFilters";
import { transformValue } from "./transform";
import { getValue } from "~/operations/entry/filtering/getValue";

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
    if (keys.length === 0 && !fullTextSearch) {
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
        term: fullTextSearch?.term,
        targetFields: fullTextSearch?.fields,
        fields,
        fromStorage,
        plugin: fullTextSearchPlugin
    });

    const promises: Promise<CmsEntry | null>[] = records.map(async record => {
        /**
         * We need to go through all the filters and apply them to the given record.
         */
        for (const filter of filters) {
            const rawValue = getValue(record, filter.path);

            const field = fields[filter.fieldPathId];
            const plainValue = await fromStorage(field, rawValue);

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
            item: record
        });
        if (!result) {
            return null;
        }

        return record;
    });

    /**
     * We run filtering as promises, so it is a bit faster than in for ... of loop.
     */
    const results: (CmsEntry | null)[] = await Promise.all(promises);

    /**
     * And filter out the null values which are returned when filter is not satisfied.
     */
    return results.filter(Boolean) as CmsEntry[];
};
