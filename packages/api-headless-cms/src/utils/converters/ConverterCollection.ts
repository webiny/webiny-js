import WebinyError from "@webiny/error";
import { Converter } from "./Converter";
import { CmsEntryValues, CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { CmsModelFieldConverterPlugin } from "~/plugins";
import { PluginsContainer } from "@webiny/plugins";

export interface CmsModelFieldsWithParent extends CmsModelField {
    parent?: CmsModelField | null;
}
export interface ConverterCollectionConvertParams {
    fields: CmsModelFieldsWithParent[];
    values: CmsEntryValues;
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
        if (!defaultFieldConverterPlugin) {
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
        if (!converter) {
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

    public convertToStorage(params: ConverterCollectionConvertParams): CmsEntryValues {
        const { fields, values: inputValues } = params;
        let output: CmsEntryValues = {};
        for (const field of fields) {
            /**
             *
             */
            const converter = this.getConverter(field.type);
            /**
             *
             */
            const values = converter.convertToStorage({
                field,
                value: inputValues[field.fieldId]
            });

            output = {
                ...output,
                ...values
            };
        }

        return output;
    }

    public convertFromStorage(params: ConverterCollectionConvertParams): CmsEntryValues {
        const { fields, values: inputValues } = params;
        let output: CmsEntryValues = {};
        for (const field of fields) {
            /**
             *
             */
            const converter = this.getConverter(field.type);
            /**
             *
             */
            const values = converter.convertFromStorage({
                field,
                value: inputValues[field.storageId]
            });

            output = {
                ...output,
                ...values
            };
        }

        return output;
    }
}
