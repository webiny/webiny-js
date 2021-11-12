import { CmsModelFieldToElasticsearchPlugin } from "~/types";
import {
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";
import { PluginsContainer } from "@webiny/plugins";

interface ProcessToIndex {
    (params: {
        fields: CmsModelField[];
        value: Record<string, any>;
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
        rawValue: Record<string, any>;
        getFieldIndexPlugin: (fieldType: string) => CmsModelFieldToElasticsearchPlugin;
        getFieldTypePlugin: (fieldType: string) => CmsModelFieldToGraphQLPlugin;
        plugins: PluginsContainer;
        model: CmsModel;
    }): Record<string, any>;
}

const processToIndex: ProcessToIndex = ({
    fields,
    value: sourceValue,
    getFieldIndexPlugin,
    getFieldTypePlugin,
    plugins,
    model
}) => {
    const reducer = (values, field) => {
        const plugin = getFieldIndexPlugin(field.type);
        const { value, rawValue } = plugin.toIndex({
            model,
            field,
            value: sourceValue[field.fieldId],
            getFieldIndexPlugin,
            getFieldTypePlugin,
            plugins
        });

        if (value !== undefined) {
            values.value[field.fieldId] = value;
        }

        if (rawValue !== undefined) {
            values.rawValue[field.fieldId] = rawValue;
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
    const reducer = (values, field) => {
        const plugin = getFieldIndexPlugin(field.type);
        const value = plugin.fromIndex({
            plugins,
            model,
            field,
            value: sourceValue[field.fieldId],
            rawValue: sourceRawValue[field.fieldId],
            getFieldIndexPlugin,
            getFieldTypePlugin
        });

        if (value !== undefined) {
            values[field.fieldId] = value;
        }

        return values;
    };

    return fields.reduce(reducer, {});
};

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-object",
    fieldType: "object",
    toIndex({ plugins, model, field, value, getFieldIndexPlugin, getFieldTypePlugin }) {
        if (!value) {
            return { value: null };
        }

        const fields = field.settings.fields as CmsModelField[];

        /**
         * In "object" field, value is either an object or an array of objects.
         */
        if (field.multipleValues) {
            const values = value.reduce(
                (acc, item) => {
                    const { value, rawValue } = processToIndex({
                        value: item,
                        getFieldIndexPlugin,
                        getFieldTypePlugin,
                        model,
                        plugins,
                        fields
                    });

                    if (Object.keys(value).length > 0) {
                        acc.value.push(value);
                    }

                    if (Object.keys(rawValue).length > 0) {
                        acc.rawValue.push(rawValue);
                    }
                    return acc;
                },
                { value: [], rawValue: [] }
            );

            return {
                value: values.value.length > 0 ? values.value : undefined,
                rawValue: values.rawValue.length > 0 ? values.rawValue : undefined
            };
        }

        return processToIndex({
            value,
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

        const fields = field.settings.fields as CmsModelField[];

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

            return source.map((_, index) =>
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
