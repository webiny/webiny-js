import {
    CmsContentEntry,
    CmsContentEntryListWhere,
    CmsContentModel,
    CmsContentModelField,
    CmsContext
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import lodashSortBy from "lodash.sortby";
import dotProp from "dot-prop";
import {
    format as formatDateTime,
    parse as parseDateTime,
    parseISO as parseISODateTime
} from "date-fns";
import { CmsFieldValueFilterArgs, CmsFieldValueFilterPlugin } from "../../types";

interface CreateFiltersArgs {
    context: CmsContext;
    model: CmsContentModel;
    where: CmsContentEntryListWhere;
}

interface ItemFilter {
    fieldId: string;
    target: string;
    matches: (args: CmsFieldValueFilterArgs<any, any>) => boolean;
    negate: boolean;
    compareValue: any;
}

interface FilterItemsArgs {
    items: CmsContentEntry[];
    where: CmsContentEntryListWhere;
    model: CmsContentModel;
    context: CmsContext;
}

const defaultSystemFieldIds = ["id", "createdOn", "savedOn", "createdBy", "ownedBy"];
const fieldPathsTransformations = {
    createdBy: "createdBy.id",
    ownedBy: "ownedBy.id"
};
const dateTimeField = (id: string): CmsContentModelField => {
    return {
        id,
        type: "datetime",
        fieldId: id,
        multipleValues: false,
        listValidation: [],
        validation: [],
        renderer: {
            name: "renderer"
        },
        predefinedValues: {
            enabled: false,
            values: []
        },
        placeholderText: id,
        helpText: id,
        label: id,
        settings: {
            type: "datetime"
        }
    };
};
const defaultSystemFields = {
    createdOn: dateTimeField("createdOn"),
    savedOn: dateTimeField("createdOn")
};
const VALUES_ATTRIBUTE = "values";

const extractWhereArgs = (key: string) => {
    const result = key.split("_");
    const field = result.shift();
    const rawOp = result.length === 0 ? "eq" : result.join("_");

    const negate = rawOp.match("not_") !== null;
    const operation = rawOp.replace("not_", "");
    return { field, operation, negate };
};
const getFilterPlugins = (context: CmsContext): Record<string, CmsFieldValueFilterPlugin<any>> => {
    const plugins = context.plugins.byType<CmsFieldValueFilterPlugin<any>>(
        "cms-field-value-filter"
    );
    if (plugins.length === 0) {
        throw new WebinyError("Missing filtering plugins.", "FILTERING_PLUGINS_ERROR");
    }
    return plugins.reduce((matchers, plugin) => {
        if (matchers[plugin.operation]) {
            throw new WebinyError(
                "Cannot have multiple filter plugins for one operation.",
                "FILTERING_PLUGINS_ERROR",
                {
                    plugin,
                    operation: plugin.operation
                }
            );
        }
        matchers[plugin.operation] = plugin;
        return matchers;
    }, {});
};
const createFilters = (args: CreateFiltersArgs): ItemFilter[] => {
    const { where, context } = args;
    const plugins = getFilterPlugins(context);
    return Object.keys(where).map(key => {
        const { field, operation, negate } = extractWhereArgs(key);
        const target = defaultSystemFieldIds.includes(field)
            ? field
            : `${VALUES_ATTRIBUTE}.${field}`;

        return {
            fieldId: field,
            target,
            matches: plugins[operation].matches,
            negate,
            compareValue: where[key]
        };
    });
};
const transformValue = (field: CmsContentModelField | undefined, value: any): any => {
    if (!field) {
        return value;
    } else if (field.type === "datetime" && field.settings && field.settings.type) {
        const type = field.settings.type;
        if (type === "time") {
            const parsed = parseDateTime(value, "HH:mm:ss", new Date());
            const [hours, minutes, seconds] = formatDateTime(parsed, "HH:mm:ss")
                .split(":")
                .map(Number);
            return hours * 60 * 60 + minutes * 60 + seconds;
        }
        return parseISODateTime(value);
    } else if (field.type === "number") {
        return Number(value);
    }
    return value;
};
export const filterItems = (args: FilterItemsArgs): CmsContentEntry[] => {
    const { items, where, context, model } = args;

    const modelFields = model.fields.reduce((acc, field) => {
        acc[field.fieldId] = field;
        return acc;
    }, {});

    const filters = createFilters({
        context,
        model,
        where
    });
    return items.filter(item => {
        for (const filter of filters) {
            const target = fieldPathsTransformations[filter.fieldId] || filter.target;
            const value = dotProp.get(item, target);

            const field = modelFields[filter.fieldId] || defaultSystemFields[filter.fieldId];
            const result = filter.matches({
                fieldValue: transformValue(field, value),
                compareValue: transformValue(field, filter.compareValue)
            });
            return filter.negate ? !result : result;
        }
        return true;
    });
};

const extractSort = (sortBy: string, fields: string[]): { field: string; reverse: boolean } => {
    const result = sortBy.split("_");
    if (result.length !== 2) {
        throw new WebinyError(
            "Problem in determining the sorting for the entry items.",
            "SORT_ERROR",
            {
                sortBy
            }
        );
    }
    const [field, order] = result;

    const isSystemField = defaultSystemFieldIds.includes(field);
    if (fields.includes(field) === false && !isSystemField) {
        throw new WebinyError(
            "Sorting field does not exist in the content model.",
            "SORTING_FIELD_ERROR",
            {
                field,
                fields
            }
        );
    }
    return {
        field: isSystemField ? field : `${VALUES_ATTRIBUTE}.${field}`,
        reverse: order === "DESC"
    };
};

interface SortEntryItemsArgs {
    model: CmsContentModel;
    items: CmsContentEntry[];
    sort: string[];
}

export const sortEntryItems = (args: SortEntryItemsArgs): CmsContentEntry[] => {
    const { model, items, sort } = args;
    if (!sort || sort.length === 0) {
        return items;
    }
    if (sort.length > 1) {
        throw new WebinyError("Sorting is limited to a single field", "SORT_ERROR", {
            sort: sort
        });
    }
    const [firstSort] = sort;
    if (!firstSort) {
        throw new WebinyError("Empty sort array item.", "SORT_ERROR", {
            sort
        });
    }
    const fields = defaultSystemFieldIds.concat(model.fields.map(field => field.fieldId));

    const { field, reverse } = extractSort(firstSort, fields);
    const newItems: CmsContentEntry[] = lodashSortBy(items, field);
    if (!reverse) {
        return newItems;
    }
    return newItems.reverse();
};
