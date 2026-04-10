import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { getFieldIdentifiers } from "~/helpers/index.js";
import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";

interface ProcessToIndexParams {
    fields: CmsModelField[];
    value: Record<string, any>;
    rawValue: Record<string, any>;
    getFieldIndex: (fieldType: string) => CmsEntryOpenSearchFieldIndex.Interface;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    model: CmsModel;
}

interface ReducerValue {
    value: Record<string, any>;
    rawValue: Record<string, any>;
}

const processToIndex = (params: ProcessToIndexParams): ReducerValue => {
    const {
        fields,
        value: sourceValue,
        rawValue: sourceRawValue,
        getFieldIndex,
        fieldRegistry,
        model
    } = params;

    return fields.reduce<ReducerValue>(
        (values, field) => {
            const plugin = getFieldIndex(field.type);

            const identifiers = getFieldIdentifiers(sourceValue, sourceRawValue, field);
            if (!identifiers) {
                return values;
            }

            const { value, rawValue } = plugin.toIndex({
                model,
                field,
                value: sourceValue[identifiers.valueIdentifier || identifiers.rawValueIdentifier],
                rawValue:
                    sourceRawValue[identifiers.rawValueIdentifier || identifiers.valueIdentifier],
                getFieldIndex,
                fieldRegistry
            });

            if (value !== undefined) {
                values.value[identifiers.valueIdentifier || identifiers.rawValueIdentifier] = value;
            }
            if (rawValue !== undefined) {
                values.rawValue[identifiers.rawValueIdentifier || identifiers.valueIdentifier] =
                    rawValue;
            }

            return values;
        },
        { value: {}, rawValue: {} }
    );
};

interface ProcessFromIndexParams {
    fields: CmsModelField[];
    value: Record<string, any>;
    rawValue?: Record<string, any> | null;
    getFieldIndex: (fieldType: string) => CmsEntryOpenSearchFieldIndex.Interface;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    model: CmsModel;
}

const processFromIndex = (params: ProcessFromIndexParams): Record<string, any> => {
    const {
        fields,
        value: sourceValue,
        rawValue: sourceRawValue,
        getFieldIndex,
        fieldRegistry,
        model
    } = params;

    return fields.reduce<Record<string, any>>((values, field) => {
        const plugin = getFieldIndex(field.type);

        const identifiers = getFieldIdentifiers(sourceValue, sourceRawValue, field);
        if (!identifiers) {
            return values;
        }

        const value = plugin.fromIndex({
            fieldRegistry,
            model,
            field,
            value: sourceValue[identifiers.valueIdentifier || identifiers.rawValueIdentifier],
            rawValue: sourceRawValue
                ? sourceRawValue[identifiers.rawValueIdentifier || identifiers.valueIdentifier]
                : null,
            getFieldIndex
        });

        if (value !== undefined) {
            values[identifiers.valueIdentifier || identifiers.rawValueIdentifier] = value;
        }

        return values;
    }, {});
};

class ObjectFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = "object";

    public toIndex({
        fieldRegistry,
        model,
        field,
        value: initialValue,
        rawValue: initialRawValue,
        getFieldIndex
    }: CmsEntryOpenSearchFieldIndex.ToIndex): CmsEntryOpenSearchFieldIndex.ToValue {
        if (!initialValue) {
            return { value: null };
        }

        const fields = (field.settings?.fields || []) as CmsModelField[];

        if (field.list) {
            const result: { value: Record<string, any>[]; rawValue: Record<string, any>[] } = {
                value: [],
                rawValue: []
            };
            for (const key in initialValue) {
                const { value, rawValue } = processToIndex({
                    value: initialValue[key],
                    rawValue: initialRawValue[key],
                    getFieldIndex,
                    model,
                    fieldRegistry,
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
            getFieldIndex,
            model,
            fieldRegistry,
            fields
        });
    }

    public fromIndex({
        field,
        value,
        rawValue,
        model,
        getFieldIndex,
        fieldRegistry
    }: CmsEntryOpenSearchFieldIndex.FromIndex): any {
        if (!value) {
            return null;
        }

        const fields = field.settings?.fields || [];

        if (field.list) {
            const source = value || rawValue || [];

            return source.map((_: any, index: number) =>
                processFromIndex({
                    value: value ? value[index] || {} : {},
                    rawValue: rawValue ? rawValue[index] || {} : {},
                    getFieldIndex,
                    model,
                    fieldRegistry,
                    fields
                })
            );
        }

        return processFromIndex({
            value,
            rawValue,
            getFieldIndex,
            model,
            fieldRegistry,
            fields
        });
    }
}

export const ObjectFieldIndex = CmsEntryOpenSearchFieldIndex.createImplementation({
    implementation: ObjectFieldIndexImpl,
    dependencies: []
});
