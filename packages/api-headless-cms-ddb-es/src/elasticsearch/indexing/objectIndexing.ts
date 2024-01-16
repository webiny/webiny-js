/**
 * TODO remove rawValue when field aliases and field types targeting will be active.
 *
 * Currently we use rawValue for the values that we do not want to be indexed.
 * When field aliases and types in the value path will be active, we can target the keys directly.
 *
 * This change will be incompatible with the current systems so we will need to release a major version.
 *
 */

import { CmsModelFieldToElasticsearchPlugin } from "~/types";
import {
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";
import { PluginsContainer } from "@webiny/plugins";
import { getFieldIdentifiers } from "~/helpers";

interface ProcessToIndex {
    (params: {
        fields: CmsModelField[];
        value: Record<string, any>;
        rawValue: Record<string, any>;
        getFieldIndexPlugin: (fieldType: string) => CmsModelFieldToElasticsearchPlugin;
        getFieldTypePlugin: (fieldType: string) => CmsModelFieldToGraphQLPlugin;
        plugins: PluginsContainer;
        model: CmsModel;
    }): Record<"value" | "rawValue", Record<string, any>>;
}

interface ProcessFromIndex {
    (params: {
        fields: CmsModelField[];
        value: Record<string, any>;
        rawValue?: Record<string, any> | null;
        getFieldIndexPlugin: (fieldType: string) => CmsModelFieldToElasticsearchPlugin;
        getFieldTypePlugin: (fieldType: string) => CmsModelFieldToGraphQLPlugin;
        plugins: PluginsContainer;
        model: CmsModel;
    }): Record<string, any>;
}

interface ReducerValue {
    value: {
        [key: string]: string;
    };
    rawValue: {
        [key: string]: string;
    };
}

const processToIndex: ProcessToIndex = ({
    fields,
    value: sourceValue,
    rawValue: sourceRawValue,
    getFieldIndexPlugin,
    getFieldTypePlugin,
    plugins,
    model
}) => {
    const reducer = (values: ReducerValue, field: CmsModelField) => {
        const plugin = getFieldIndexPlugin(field.type);
        if (!plugin || !plugin.toIndex) {
            return values;
        }

        const identifiers = getFieldIdentifiers(sourceValue, sourceRawValue, field);
        if (!identifiers) {
            return values;
        }

        const { value, rawValue } = plugin.toIndex({
            model,
            field,
            value: sourceValue[identifiers.valueIdentifier || identifiers.rawValueIdentifier],
            rawValue: sourceRawValue[identifiers.rawValueIdentifier || identifiers.valueIdentifier],
            getFieldIndexPlugin,
            getFieldTypePlugin,
            plugins
        });

        if (value !== undefined) {
            values.value[identifiers.valueIdentifier || identifiers.rawValueIdentifier] = value;
        }
        if (rawValue !== undefined) {
            values.rawValue[identifiers.rawValueIdentifier || identifiers.valueIdentifier] =
                rawValue;
        }

        return values;
    };

    return fields.reduce(reducer, { value: {}, rawValue: {} });
};
const processFromIndex: ProcessFromIndex = ({
    fields,
    value: sourceValue,
    rawValue: sourceRawValue,
    getFieldIndexPlugin,
    getFieldTypePlugin,
    plugins,
    model
}) => {
    const reducer = (values: Record<string, string>, field: CmsModelField) => {
        const plugin = getFieldIndexPlugin(field.type);
        if (!plugin || !plugin.fromIndex) {
            return values;
        }
        const identifiers = getFieldIdentifiers(sourceValue, sourceRawValue, field);
        if (!identifiers) {
            return values;
        }

        const value = plugin.fromIndex({
            plugins,
            model,
            field,
            value: sourceValue[identifiers.valueIdentifier || identifiers.rawValueIdentifier],
            rawValue: sourceRawValue
                ? sourceRawValue[identifiers.rawValueIdentifier || identifiers.valueIdentifier]
                : null,
            getFieldIndexPlugin,
            getFieldTypePlugin
        });

        if (value !== undefined) {
            values[identifiers.valueIdentifier || identifiers.rawValueIdentifier] = value;
        }

        return values;
    };

    return fields.reduce(reducer, {});
};

interface ToIndexMultipleFieldValue {
    value: Record<string, string>[];
    rawValue: Record<string, string>[];
}

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-object",
    fieldType: "object",
    toIndex({
        plugins,
        model,
        field,
        value: initialValue,
        rawValue: initialRawValue,
        getFieldIndexPlugin,
        getFieldTypePlugin
    }) {
        if (!initialValue) {
            return {
                value: null
            };
        }

        const fields = (field.settings?.fields || []) as CmsModelField[];

        /**
         * In "object" field, value is either an object or an array of objects.
         */
        if (field.multipleValues) {
            const result: ToIndexMultipleFieldValue = {
                value: [],
                rawValue: []
            };
            for (const key in initialValue) {
                const { value, rawValue } = processToIndex({
                    value: initialValue[key],
                    rawValue: initialRawValue[key],
                    getFieldIndexPlugin,
                    getFieldTypePlugin,
                    model,
                    plugins,
                    fields
                });

                result.value.push(value);
                result.rawValue.push(rawValue);
            }

            return {
                value: result.value.length > 0 ? result.value : undefined,
                rawValue: result.rawValue.length > 0 ? result.rawValue : undefined
            };
        }

        return processToIndex({
            value: initialValue,
            rawValue: initialRawValue,
            getFieldIndexPlugin,
            getFieldTypePlugin,
            model,
            plugins,
            fields
        });
    },
    fromIndex({ field, value, rawValue, model, plugins, getFieldIndexPlugin, getFieldTypePlugin }) {
        if (!value) {
            return null;
        }

        const fields = field.settings?.fields || [];

        /**
         * In "object" field, value is either an object or an array of objects.
         */
        if (field.multipleValues) {
            /**
             * Why this `value || rawValue || []`?
             * It's possible that an object contains all non-indexable fields, or vice-versa, and so
             * we can never be sure which array we can reliably use as a source of values.
             */
            const source = value || rawValue || [];

            return source.map((_: any, index: number) =>
                processFromIndex({
                    value: value ? value[index] || {} : {},
                    rawValue: rawValue ? rawValue[index] || {} : {},
                    getFieldIndexPlugin,
                    getFieldTypePlugin,
                    model,
                    plugins,
                    fields
                })
            );
        }

        return processFromIndex({
            value,
            rawValue,
            getFieldIndexPlugin,
            getFieldTypePlugin,
            model,
            plugins,
            fields
        });
    }
});
