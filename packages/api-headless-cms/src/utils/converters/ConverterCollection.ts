import WebinyError from "@webiny/error";
import { Converter } from "./Converter";
import { CmsEntryValues, CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { CmsModelFieldConverterPlugin } from "~/plugins";
import { PluginsContainer } from "@webiny/plugins";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

export interface CmsModelFieldsWithParent extends CmsModelField {
    parent?: CmsModelField | null;
}

export interface CmsModelConverterCallable {
    (params: ConverterCollectionConvertParams): CmsEntryValues;
}

export interface ConverterCollectionConvertParams {
    fields: CmsModelFieldsWithParent[];
    values?: CmsEntryValues;
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
        const converter = this.converters.get(type);
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

    public convertToStorage(params: ConverterCollectionConvertParams): CmsEntryValues | undefined {
        const { fields, values: inputValues } = params;
        if (inputValues === undefined) {
            return undefined;
        }

        this.attachHasOwnProperty(inputValues);

        return fields.reduce<CmsEntryValues>((output, field) => {
            const baseType = getBaseFieldType(field);
            const converter = this.getConverter(baseType);
            if (inputValues === null || inputValues.hasOwnProperty(field.fieldId) === false) {
                return output;
            }
            const values = converter.convertToStorage({
                field,
                value: inputValues[field.fieldId]
            });

            return {
                ...output,
                ...values
            };
        }, {});
    }

    public convertFromStorage(
        params: ConverterCollectionConvertParams
    ): CmsEntryValues | undefined {
        const { fields, values: inputValues } = params;
        if (inputValues === undefined) {
            return undefined;
        }

        return fields.reduce((output, field) => {
            const baseType = getBaseFieldType(field);
            const converter = this.getConverter(baseType);
            if (inputValues === null || inputValues.hasOwnProperty(field.storageId) === false) {
                return output;
            }
            const values = converter.convertFromStorage({
                field,
                value: inputValues[field.storageId]
            });

            return {
                ...output,
                ...values
            };
        }, {});
    }

    /**
     * This method attaches hasOwnProperty when received object was created via Object.create(null) - no inheritance of Object.
     * At that point, hasOwnProperty does not exist, and we need to add it.
     *
     * TODO add more checks if required
     */
    private attachHasOwnProperty(values: CmsEntryValues) {
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
