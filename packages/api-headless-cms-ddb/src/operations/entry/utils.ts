import WebinyError from "@webiny/error";
import lodashSortBy from "lodash.sortby";
import dotProp from "dot-prop";
import {
    CmsEntry,
    CmsEntryListWhere,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types";
import { Plugin } from "@webiny/plugins/types";
import { CmsFieldFilterValueTransformPlugin } from "~/types";
import { systemFields } from "./systemFields";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { PluginsContainer } from "@webiny/plugins";
import {
    CmsEntryFieldFilterPathPlugin,
    Params as CmsEntryFieldFilterPathPluginParams,
    CreatePathCallable as CmsEntryFieldFieldCreatePathCallable
} from "~/plugins/CmsEntryFieldFilterPathPlugin";

interface ModelField {
    def: CmsModelField;
    valueTransformer: (value: any) => any;
    createPath: CmsEntryFieldFieldCreatePathCallable;
    isSystemField?: boolean;
}

type ModelFieldRecords = Record<string, ModelField>;

type MappedPlugins<T extends Plugin> = Record<string, T>;

interface CreateFiltersParams {
    plugins: PluginsContainer;
    where: CmsEntryListWhere;
    fields: ModelFieldRecords;
}

interface ItemFilter {
    fieldId: string;
    path: string;
    filterPlugin: ValueFilterPlugin;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export interface FilterItemFromStorage {
    (field: CmsModelField, value: any): Promise<any>;
}
interface FilterItemsParams {
    items: CmsEntry[];
    where: CmsEntryListWhere;
    plugins: PluginsContainer;
    fields: ModelFieldRecords;
    fromStorage: FilterItemFromStorage;
}

const VALUES_ATTRIBUTE = "values";

const extractWhereParams = (key: string) => {
    const result = key.split("_");
    const fieldId = result.shift();
    const rawOp = result.length === 0 ? "eq" : result.join("_");
    /**
     * When rawOp is not, it means it is equal negated so just return that.
     */
    if (rawOp === "not") {
        return {
            fieldId,
            operation: "eq",
            negate: true
        };
    }
    const negate = rawOp.match("not_") !== null;
    const operation = rawOp.replace("not_", "");
    return { fieldId, operation, negate };
};

const transformValue = (value: any, transform: (value: any) => any): any => {
    if (Array.isArray(value)) {
        return value.map(v => transform(v));
    }
    return transform(value);
};

interface GetFilterPluginParams {
    plugins: MappedPlugins<ValueFilterPlugin>;
    operation: string;
}
const getFilterPlugin = (params: GetFilterPluginParams) => {
    const { plugins, operation } = params;
    const plugin = plugins[operation];
    if (plugin) {
        return plugin;
    }
    throw new WebinyError(
        `There is no filter plugin for operation "${operation}".`,
        "FILTER_PLUGIN_ERROR",
        {
            operation
        }
    );
};

interface CreateValuePathParams {
    field: CmsModelField;
    plugins: MappedPlugins<CmsEntryFieldFilterPathPlugin>;
    index?: number;
}
const createValuePath = (params: CreateValuePathParams): string => {
    const { field, plugins, index } = params;
    const { fieldId } = field;
    const valuePathPlugin = plugins[field.type];
    const basePath = systemFields[fieldId] ? "" : `${VALUES_ATTRIBUTE}.`;
    if (!valuePathPlugin || valuePathPlugin.canUse(field) === false) {
        return `${basePath}${field.fieldId}`;
    }
    const path = valuePathPlugin.createPath({
        field,
        index
    });
    return `${basePath}${path}`;
};

interface ObjectFilteringParams {
    key: string;
    field: CmsModelField;
    value: any;
}
const isObjectFiltering = (params: ObjectFilteringParams): boolean => {
    const { value } = params;
    if (!value) {
        return false;
    } else if (Array.isArray(value) === true) {
        return false;
    } else if (value instanceof Date || !!value.toISOString) {
        return false;
    } else if (typeof value !== "object") {
        return false;
    }
    return true;
};

const createFilters = (params: CreateFiltersParams): ItemFilter[] => {
    const { where, plugins, fields } = params;
    const filterPlugins = getMappedPlugins<ValueFilterPlugin>({
        plugins,
        type: ValueFilterPlugin.type,
        property: "operation"
    });
    const transformValuePlugins = getMappedPlugins<CmsFieldFilterValueTransformPlugin>({
        plugins,
        type: "cms-field-filter-value-transform",
        property: "fieldType"
    });
    const valuePathPlugins = getMappedPlugins<CmsEntryFieldFilterPathPlugin>({
        plugins,
        type: CmsEntryFieldFilterPathPlugin.type,
        property: "fieldType"
    });

    const filters: ItemFilter[] = [];

    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const { fieldId, operation, negate } = extractWhereParams(key);

        const field: ModelField = fields[fieldId];
        if (!field) {
            throw new WebinyError(
                `There is no field with the fieldId "${fieldId}".`,
                "FIELD_ERROR",
                {
                    fieldId
                }
            );
        }

        const transformValuePlugin: CmsFieldFilterValueTransformPlugin =
            transformValuePlugins[field.def.type];

        const transformValueCallable = (value: any) => {
            if (!transformValuePlugin) {
                return value;
            }
            return transformValuePlugin.transform({
                field: field.def,
                value
            });
        };

        const objectFilteringParams = {
            key,
            value: where[key],
            field: field.def
        };
        if (isObjectFiltering(objectFilteringParams)) {
            const propertyFilters = Object.keys(where[key]);
            if (propertyFilters.length === 0) {
                continue;
            }
            for (const propertyFilter of propertyFilters) {
                const {
                    fieldId: propertyId,
                    operation: propertyOperation,
                    negate: propertyNegate
                } = extractWhereParams(propertyFilter);

                const filterPlugin = getFilterPlugin({
                    plugins: filterPlugins,
                    operation: propertyOperation
                });

                const basePath = createValuePath({
                    field: field.def,
                    plugins: valuePathPlugins
                });

                filters.push({
                    fieldId,
                    path: `${basePath}.${propertyId}`,
                    filterPlugin,
                    negate: propertyNegate,
                    compareValue: transformValue(
                        where[key][propertyFilter],
                        transformValueCallable
                    ),
                    transformValue: transformValueCallable
                });
            }

            continue;
        }

        const filterPlugin = getFilterPlugin({
            plugins: filterPlugins,
            operation
        });

        filters.push({
            fieldId,
            path: createValuePath({
                field: field.def,
                plugins: valuePathPlugins
            }),
            filterPlugin,
            negate,
            compareValue: transformValue(where[key], transformValueCallable),
            transformValue: transformValueCallable
        });
    }

    return filters;
};

export const filterItems = async (params: FilterItemsParams): Promise<CmsEntry[]> => {
    const { items: records, where, plugins, fields, fromStorage } = params;

    const filters = createFilters({
        plugins,
        where,
        fields
    });
    const results: CmsEntry[] = [];

    for (const key in records) {
        if (records.hasOwnProperty(key) === false) {
            continue;
        }
        const record = records[key];

        let passed = true;
        for (const filter of filters) {
            const rawValue = dotProp.get(record, filter.path);

            const plainValue = await fromStorage(fields[filter.fieldId].def, rawValue);
            /**
             * If raw value is not same as the value after the storage transform, set the value to the items being filtered.
             */
            if (plainValue !== rawValue) {
                records[key] = dotProp.set(record, filter.path, plainValue);
            }

            const value = transformValue(plainValue, filter.transformValue);
            const matched = filter.filterPlugin.matches({
                value,
                compareValue: filter.compareValue
            });
            if ((filter.negate ? !matched : matched) === false) {
                passed = false;
                break;
            }
        }
        if (!passed) {
            continue;
        }
        results.push(record);
    }
    return results;
};

const extractSort = (
    sortBy: string,
    fields: ModelFieldRecords
): { valuePath: string; reverse: boolean; fieldId: string } => {
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
    const [fieldId, order] = result;

    const modelField = fields[fieldId];

    if (!modelField) {
        throw new WebinyError(
            "Sorting field does not exist in the content model.",
            "SORTING_FIELD_ERROR",
            {
                fieldId,
                fields
            }
        );
    }
    const valuePath = modelField.createPath({
        field: modelField.def
    });
    return {
        fieldId,
        valuePath,
        reverse: order === "DESC"
    };
};

interface SortEntryItemsArgs {
    items: CmsEntry[];
    sort: string[];
    fields: ModelFieldRecords;
}

export const sortEntryItems = (params: SortEntryItemsArgs): CmsEntry[] => {
    const { items, sort = [], fields } = params;
    if (items.length <= 1) {
        return items;
    } else if (sort.length === 0) {
        sort.push("savedOn_DESC");
    } else if (sort.length > 1) {
        throw new WebinyError("Sorting is limited to a single field.", "SORT_ERROR", {
            sort: sort
        });
    }
    const [firstSort] = sort;
    if (!firstSort) {
        throw new WebinyError("Empty sort array item.", "SORT_ERROR", {
            sort
        });
    }

    const { fieldId, valuePath, reverse } = extractSort(firstSort, fields);
    const field = fields[fieldId];

    const itemsToSort = items.map(item => {
        return {
            id: item.id,
            value: field.valueTransformer(dotProp.get(item, valuePath))
        };
    });
    const sortedItems: { id: string; value: any }[] = lodashSortBy(itemsToSort, "value");
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

const getMappedPlugins = <T extends Plugin>(params: {
    plugins: PluginsContainer;
    type: string;
    property: string;
}): MappedPlugins<T> => {
    const { plugins: pluginsContainer, type, property } = params;
    const plugins = pluginsContainer.byType<T>(type);
    if (plugins.length === 0) {
        throw new WebinyError(`There are no plugins of type "${type}".`, "PLUGINS_ERROR", {
            type
        });
    }
    return plugins.reduce((collection, plugin) => {
        const key = plugin[property];
        if (typeof key !== "string") {
            throw new WebinyError(
                "Property to map the plugins on must be a string.",
                "PLUGIN_PROPERTY_ERROR",
                {
                    type,
                    property
                }
            );
        }
        collection[key] = plugin;
        return collection;
    }, {});
};

export const buildModelFields = ({
    plugins,
    model
}: {
    plugins: PluginsContainer;
    model: CmsModel;
}) => {
    const transformValuePlugins = getMappedPlugins<CmsFieldFilterValueTransformPlugin>({
        plugins,
        type: "cms-field-filter-value-transform",
        property: "fieldType"
    });
    const valuePathPlugins = getMappedPlugins<CmsEntryFieldFilterPathPlugin>({
        plugins,
        type: CmsEntryFieldFilterPathPlugin.type,
        property: "fieldType"
    });
    const fields: ModelFieldRecords = Object.values(systemFields).reduce((collection, field) => {
        const transformValuePlugin = transformValuePlugins[field.type];
        const valuePathPlugin = valuePathPlugins[field.type];

        let createPath: CmsEntryFieldFilterPathPluginParams["path"] = params => {
            return params.field.fieldId;
        };
        if (valuePathPlugin) {
            createPath = params => {
                return valuePathPlugin.createPath(params);
            };
        }
        collection[field.fieldId] = {
            def: field,
            valueTransformer: (value: any) => {
                if (!transformValuePlugin) {
                    return value;
                }
                return transformValuePlugin.transform({ field, value });
            },
            createPath,
            isSystemField: true
        };

        return collection;
    }, {} as ModelFieldRecords);

    return model.fields.reduce((collection, field) => {
        const transformValuePlugin = transformValuePlugins[field.type];
        const valuePathPlugin = valuePathPlugins[field.type];

        let createPath: CmsEntryFieldFilterPathPluginParams["path"] = params => {
            return `${VALUES_ATTRIBUTE}.${params.field.fieldId}`;
        };
        if (valuePathPlugin) {
            createPath = params => {
                return valuePathPlugin.createPath(params);
            };
        }

        collection[field.fieldId] = {
            def: field,
            valueTransformer: (value: any) => {
                if (!transformValuePlugin) {
                    return value;
                }
                return transformValuePlugin.transform({ field, value });
            },
            createPath
        };

        return collection;
    }, fields);
};
