import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { CmsFieldFilterValueTransformPlugin } from "~/types";
import WebinyError from "@webiny/error";
import { PluginsContainer } from "@webiny/plugins";
import { Field } from "./types";
import { getMappedPlugins } from "./mapPlugins";
import { extractWhereParams } from "./where";
import { transformValue } from "./transform";
import { CmsEntryFieldFilterPlugin } from "~/plugins/CmsEntryFieldFilterPlugin";

interface CreateFiltersParams {
    plugins: PluginsContainer;
    where: Partial<CmsEntryListWhere>;
    fields: Record<string, Field>;
}

export interface ItemFilter {
    field: Field;
    path: string;
    fieldPathId: string;
    plugin: ValueFilterPlugin;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export const createFilters = (params: CreateFiltersParams): ItemFilter[] => {
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
    const fieldFilterCreatePlugins = getMappedPlugins<CmsEntryFieldFilterPlugin>({
        plugins,
        type: CmsEntryFieldFilterPlugin.type,
        property: "fieldType"
    });

    const defaultFilterCreatePlugin = fieldFilterCreatePlugins["*"] as CmsEntryFieldFilterPlugin;

    const getFilterCreatePlugin = (type: string) => {
        const filterCreatePlugin = fieldFilterCreatePlugins[type] || defaultFilterCreatePlugin;
        if (filterCreatePlugin) {
            return filterCreatePlugin;
        }
        throw new WebinyError(
            `There is no filter create plugin for the field type "${type}".`,
            "MISSING_FILTER_CREATE_PLUGIN",
            {
                type
            }
        );
    };

    const filters: ItemFilter[] = [];

    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        /**
         * At the moment we do not allow "OR" and "AND" conditional filtering, so throw an error on it.
         */
        if (key === "AND") {
            throw new WebinyError(
                `Conditional "AND" is currently disabled in the DynamoDB only deployment.`,
                "DISABLED_AND_CONDITIONAL"
            );
        } else if (key === "OR") {
            throw new WebinyError(
                `Conditional "OR" is currently disabled in the DynamoDB only deployment.`,
                "DISABLED_OR_CONDITIONAL"
            );
        }

        const value = (where as any)[key];
        if (value === undefined) {
            continue;
        }

        const whereParams = extractWhereParams(key);
        if (!whereParams) {
            continue;
        }

        const { fieldId, operation, negate } = whereParams;

        const field = fields[fieldId];
        if (!field) {
            throw new WebinyError(
                `There is no field with the fieldId "${fieldId}".`,
                "FIELD_ERROR",
                {
                    fieldId
                }
            );
        }

        /**
         * We need a filter create plugin for this type.
         */
        const filterCreatePlugin = getFilterCreatePlugin(field.type);

        const transformValuePlugin: CmsFieldFilterValueTransformPlugin =
            transformValuePlugins[field.type];

        const transformValueCallable = (value: any) => {
            if (!transformValuePlugin) {
                return value;
            }
            return transformValuePlugin.transform({
                field,
                value
            });
        };

        const result = filterCreatePlugin.create({
            key,
            value,
            valueFilterPlugins: filterPlugins,
            transformValuePlugins,
            getFilterCreatePlugin,
            operation,
            negate,
            field,
            fields,
            compareValue: transformValue({
                value,
                transform: transformValueCallable
            }),
            transformValue: transformValueCallable
        });
        /**
         * There is a possibility of
         * - no result
         * - result being an array
         * - result being an object
         */
        if (!result) {
            continue;
        }
        if (Array.isArray(result)) {
            filters.push(...result);
            continue;
        }
        filters.push(result);
    }

    return filters;
};
