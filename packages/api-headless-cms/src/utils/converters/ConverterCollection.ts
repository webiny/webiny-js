import WebinyError from "@webiny/error";
import { Converter } from "./Converter.js";
import type { CmsEntryValues, CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types/index.js";
import { CmsModelFieldConverterPlugin } from "~/plugins/index.js";
import type { PluginsContainer } from "@webiny/plugins";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";

export interface CmsModelFieldsWithParent extends CmsModelField {
    parent?: CmsModelField | null;
}

export interface CmsModelConverterCallable<T extends CmsEntryValues = CmsEntryValues> {
    (params: ConverterCollectionConvertParams<T>): T;
}

export interface ConverterCollectionConvertParams<T extends CmsEntryValues = CmsEntryValues> {
    fields: CmsModelFieldsWithParent[];
    values?: T;
}

export interface ConverterCollectionParams {
    plugins: PluginsContainer;
}

export class ConverterCollection {
    private readonly converters: Map<string, Converter> = new Map();

    public constructor(params: ConverterCollectionParams) {
        const { plugins } = params;
        const fieldGraphQLPlugins = plugins.byType<CmsModelFieldToGraphQLPlugin>(
            "cms-model-field-to-graphql"
        );
        const fieldConverterPlugins = plugins.byType<CmsModelFieldConverterPlugin>(
            CmsModelFieldConverterPlugin.type
        );
        const defaultFieldConverterPlugin = fieldConverterPlugins.find(
            pl => pl.getFieldType() === "*"
        );
        if (defaultFieldConverterPlugin === undefined) {
            throw new WebinyError(
                `Missing default field converter plugin.`,
                "DEFAULT_FIELD_CONVERTER_ERROR"
            );
        }
        for (const fieldGraphQLPlugin of fieldGraphQLPlugins) {
            const plugin = fieldConverterPlugins.find(
                pl => pl.getFieldType() === fieldGraphQLPlugin.fieldType
            );
            const converter = new Converter({
                type: fieldGraphQLPlugin.fieldType,
                plugin: plugin || defaultFieldConverterPlugin
            });

            this.addConverter(converter);
        }
    }

    public addConverter(converter: Converter): void {
        converter.setConverterCollection(this);
        this.converters.set(converter.getType(), converter);
    }

    public getConverter(type: string): Converter {
        const baseType = getBaseFieldType({ type });
        const converter = this.converters.get(baseType);
        if (converter === undefined) {
            throw new WebinyError(
                `Missing converter for field type "${type}".`,
                "CONVERTER_ERROR",
                {
                    type
                }
            );
        }
        return converter;
    }

    public convertToStorage<T extends CmsEntryValues = CmsEntryValues>(
        params: ConverterCollectionConvertParams<T>
    ): T | undefined {
        const { fields, values: inputValues } = params;
        if (inputValues === undefined) {
            return undefined;
        }

        this.attachHasOwnProperty<T>(inputValues);

        return fields.reduce<T>((output, field) => {
            const converter = this.getConverter(field.type);
            if (inputValues === null || inputValues.hasOwnProperty(field.fieldId) === false) {
                return output;
            }
            const values = converter.convertToStorage({
                field,
                value: inputValues[field.fieldId as keyof T]
            });

            return {
                ...output,
                ...values
            };
        }, {} as T);
    }

    public convertFromStorage<T extends CmsEntryValues = CmsEntryValues>(
        params: ConverterCollectionConvertParams<T>
    ): T | undefined {
        const { fields, values: inputValues } = params;
        if (inputValues === undefined) {
            return undefined;
        }

        return fields.reduce<T>((output, field) => {
            const converter = this.getConverter(field.type);
            if (inputValues === null || inputValues.hasOwnProperty(field.storageId) === false) {
                return output;
            }
            const values = converter.convertFromStorage({
                field,
                value: inputValues[field.storageId as keyof T]
            });

            return {
                ...output,
                ...values
            };
        }, {} as T);
    }

    /**
     * This method attaches hasOwnProperty when received object was created via Object.create(null) - no inheritance of Object.
     * At that point, hasOwnProperty does not exist, and we need to add it.
     *
     * TODO add more checks if required
     */
    private attachHasOwnProperty<T extends CmsEntryValues = CmsEntryValues>(values: T) {
        if (
            // null or undefined?
            values === null ||
            values === undefined ||
            // not an object?
            typeof values !== "object" ||
            // maybe it's an array?
            Array.isArray(values) ||
            // and in the end, check if hasOwnProperty is a function already
            typeof values?.hasOwnProperty === "function"
        ) {
            return;
        }
        Object.defineProperty(values, "hasOwnProperty", {
            enumerable: false,
            writable: false,
            value: function (property: string) {
                return this[property] !== undefined;
            }
        });
    }
}
