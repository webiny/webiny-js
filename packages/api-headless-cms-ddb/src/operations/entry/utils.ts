import {
    CmsContentEntry,
    CmsContentEntryListWhere,
    CmsContentModel,
    CmsContentModelField,
    CmsContext
} from "@webiny/api-headless-cms/types";
import { Plugin } from "@webiny/plugins/types";
import WebinyError from "@webiny/error";
import lodashSortBy from "lodash.sortby";
import dotProp from "dot-prop";
import {
    CmsFieldFilterPathPlugin,
    CmsFieldFilterValueTransformPlugin,
    CmsFieldValueFilterArgs,
    CmsFieldValueFilterPlugin
} from "../../types";
import { systemFields } from "./systemFields";

interface ModelField {
    def: CmsContentModelField;
    valueTransformer: (value: any) => any;
    valuePath: string;
    isSystemField?: boolean;
}

type ModelFieldRecords = Record<string, ModelField>;

interface CreateFiltersArgs {
    context: CmsContext;
    where: CmsContentEntryListWhere;
    fields: ModelFieldRecords;
}

interface ItemFilter {
    fieldId: string;
    valuePath: string;
    matches: (args: CmsFieldValueFilterArgs<any, any>) => boolean;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

interface FilterItemsArgs {
    items: CmsContentEntry[];
    where: CmsContentEntryListWhere;
    context: CmsContext;
    fields: ModelFieldRecords;
}

// const fieldPathsTransformations = {
//     createdBy: "createdBy.id",
//     ownedBy: "ownedBy.id"
// };
// const dateTimeField = (id: string): CmsContentModelField => {
//     return {
//         id,
//         type: "datetime",
//         fieldId: id,
//         multipleValues: false,
//         listValidation: [],
//         validation: [],
//         renderer: {
//             name: "renderer"
//         },
//         predefinedValues: {
//             enabled: false,
//             values: []
//         },
//         placeholderText: id,
//         helpText: id,
//         label: id,
//         settings: {
//             type: "datetime"
//         }
//     };
// };
// const defaultSystemFields = {
//     createdOn: dateTimeField("createdOn"),
//     savedOn: dateTimeField("createdOn")
// };
const VALUES_ATTRIBUTE = "values";

const extractWhereArgs = (key: string) => {
    const result = key.split("_");
    const fieldId = result.shift();
    const rawOp = result.length === 0 ? "eq" : result.join("_");

    const negate = rawOp.match("not_") !== null;
    const operation = rawOp.replace("not_", "");
    return { fieldId, operation, negate };
};
const createFilters = (args: CreateFiltersArgs): ItemFilter[] => {
    const { where, context, fields } = args;
    const filterPlugins = getMappedPlugins<CmsFieldValueFilterPlugin<any>>({
        context,
        type: "cms-field-value-filter",
        property: "operation"
    });
    const transformValuePlugins = getMappedPlugins<CmsFieldFilterValueTransformPlugin>({
        context,
        type: "cms-field-filter-value-transform",
        property: "fieldType"
    });
    const valuePathPlugins = getMappedPlugins<CmsFieldFilterPathPlugin>({
        context,
        type: "cms-field-filter-path-transform",
        property: "fieldType"
    });
    return Object.keys(where).map(key => {
        const { fieldId, operation, negate } = extractWhereArgs(key);

        const field: ModelField = fields[fieldId];
        if (!field) {
            throw new WebinyError("There is no field with the fieldId.", "FIELD_ERROR", {
                fieldId
            });
        }

        const transformValuePlugin: CmsFieldFilterValueTransformPlugin =
            transformValuePlugins[field.def.type];
        const valuePathPlugin = valuePathPlugins[field.def.type];
        let targetValuePath: string;
        /**
         * add the base path if field is not a system field
         * pathPlugin should not know about that
         */
        const basePath = systemFields[fieldId] ? "" : `${VALUES_ATTRIBUTE}.`;
        if (valuePathPlugin) {
            targetValuePath = valuePathPlugin.createPath({
                field: field.def
            });
        } else if (systemFields[fieldId]) {
            targetValuePath = fieldId;
        } else {
            targetValuePath = field.def.fieldId;
        }

        const valuePath = `${basePath}${targetValuePath}`;

        // const compareValue = transformValuePlugin ? transformValuePlugin.transform({
        //     field,
        //     value: where[key],
        // }) : where[key];

        return {
            fieldId,
            valuePath,
            matches: filterPlugins[operation].matches,
            negate,
            compareValue: where[key],
            transformValue: (value: any) => {
                if (!transformValuePlugin) {
                    return value;
                }
                return transformValuePlugin.transform({
                    field: field.def,
                    value
                });
            }
        };
    });
};
export const filterItems = (args: FilterItemsArgs): CmsContentEntry[] => {
    const { items, where, context, fields } = args;

    const filters = createFilters({
        context,
        where,
        fields
    });
    return items.filter(item => {
        for (const filter of filters) {
            const { compareValue, valuePath, transformValue } = filter;
            const value = dotProp.get(item, valuePath);
            const matched = filter.matches({
                fieldValue: transformValue(value),
                compareValue: transformValue(compareValue)
            });
            if ((filter.negate ? !matched : matched) === false) {
                return false;
            }
        }
        return true;
    });
};

const extractSort = (
    sortBy: string,
    fields: ModelFieldRecords
): { valuePath: string; reverse: boolean } => {
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

    const modelField = fields[field];

    if (!modelField) {
        throw new WebinyError(
            "Sorting field does not exist in the content model.",
            "SORTING_FIELD_ERROR",
            {
                field,
                fields
            }
        );
    }
    const valuePath = modelField.valuePath;
    return {
        valuePath,
        reverse: order === "DESC"
    };
};

interface SortEntryItemsArgs {
    items: CmsContentEntry[];
    sort: string[];
    fields: ModelFieldRecords;
}

export const sortEntryItems = (args: SortEntryItemsArgs): CmsContentEntry[] => {
    const { items, sort, fields } = args;
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

    const { valuePath, reverse } = extractSort(firstSort, fields);
    const newItems: CmsContentEntry[] = lodashSortBy(items, valuePath);
    if (!reverse) {
        return newItems;
    }
    return newItems.reverse();
};

const getMappedPlugins = <T extends Plugin>(args: {
    context: CmsContext;
    type: string;
    property: string;
    allowOverrides?: boolean;
}): Record<string, T> => {
    const { context, type, property, allowOverrides } = args;
    const plugins = context.plugins.byType<T>(type);
    if (plugins.length === 0) {
        throw new WebinyError("There are no plugins of type.", "PLUGINS_ERROR", {
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
        } else if (allowOverrides !== true && collection[key]) {
            throw new WebinyError(
                "Plugin with given mapping property already exists.",
                "EXISTING_PLUGIN_PROPERTY_ERROR",
                {
                    type,
                    property,
                    key
                }
            );
        }
        collection[key] = plugin;
        return collection;
    }, {});
};

export const buildModelFields = ({
    context,
    model
}: {
    context: CmsContext;
    model: CmsContentModel;
}) => {
    const transformValuePlugins = getMappedPlugins<CmsFieldFilterValueTransformPlugin>({
        context,
        type: "cms-field-filter-value-transform",
        property: "fieldType"
    });
    const valuePathPlugins = getMappedPlugins<CmsFieldFilterPathPlugin>({
        context,
        type: "cms-field-filter-path-transform",
        property: "fieldType"
    });
    const fields: ModelFieldRecords = Object.values(systemFields).reduce((collection, field) => {
        const transformValuePlugin: CmsFieldFilterValueTransformPlugin =
            transformValuePlugins[field.type];
        const valuePathPlugin = valuePathPlugins[field.type];
        let valuePath: string;
        if (valuePathPlugin) {
            valuePath = valuePathPlugin.createPath({
                field
            });
        }
        collection[field.fieldId] = {
            field,
            valueTransformer: (value: any) => {
                if (!transformValuePlugin) {
                    return value;
                }
                return transformValuePlugin.transform({ field, value });
            },
            valuePath: valuePath || field.fieldId,
            isSystemField: true
        };

        return collection;
    }, {});

    return model.fields.reduce((collection, field) => {
        const transformValuePlugin: CmsFieldFilterValueTransformPlugin =
            transformValuePlugins[field.type];
        const valuePathPlugin = valuePathPlugins[field.type];
        let valuePath: string;
        if (valuePathPlugin) {
            valuePath = valuePathPlugin.createPath({
                field
            });
        }
        const targetValuePath = `${VALUES_ATTRIBUTE}.${valuePath || field.fieldId}`;
        collection[field.fieldId] = {
            def: field,
            valueTransformer: (value: any) => {
                if (!transformValuePlugin) {
                    return value;
                }
                return transformValuePlugin.transform({ field, value });
            },
            valuePath: targetValuePath || field.fieldId
        };

        return collection;
    }, fields);
};
