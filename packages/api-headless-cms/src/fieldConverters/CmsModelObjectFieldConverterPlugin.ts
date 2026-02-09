import type { ConvertParams } from "~/plugins/CmsModelFieldConverterPlugin.js";
import { CmsModelFieldConverterPlugin } from "~/plugins/CmsModelFieldConverterPlugin.js";
import type { CmsEntryValues, CmsModelFieldWithParent } from "~/types/index.js";
import type { ConverterCollection } from "~/utils/converters/ConverterCollection.js";
import type { GenericRecord } from "@webiny/api/types.js";

interface ProcessChildFieldsParams {
    fields: CmsModelFieldWithParent[];
    value?: GenericRecord<string> | null;
    converterCollection: ConverterCollection;
}

interface GetChildFieldsParams {
    field?: CmsModelFieldWithParent | null;
}

export class CmsModelObjectFieldConverterPlugin extends CmsModelFieldConverterPlugin {
    public override name = "cms.field.converter.object";

    public override getFieldType(): string {
        return "object";
    }

    private getChildFields({ field }: GetChildFieldsParams): CmsModelFieldWithParent[] {
        return field?.settings?.fields || [];
    }

    public override convertToStorage(params: ConvertParams): CmsEntryValues {
        const { field, value, converterCollection } = params;

        const childFields = this.getChildFields({
            field
        });
        if (childFields.length === 0) {
            return {};
        }

        if (field.multipleValues) {
            if (Array.isArray(value) === false) {
                return {
                    [field.storageId]: null
                };
            }
            return {
                [field.storageId]: value.map((itemValue: GenericRecord) => {
                    return this.processChildFieldsToStorage({
                        fields: childFields.map(child => {
                            return {
                                ...child,
                                parent: field
                            };
                        }),
                        value: itemValue,
                        converterCollection
                    });
                })
            };
        }

        const values = this.processChildFieldsToStorage({
            fields: childFields.map(child => {
                return {
                    ...child,
                    parent: field
                };
            }),
            value,
            converterCollection
        });
        if (values === undefined) {
            return {};
        }

        return {
            [field.storageId]: values
        };
    }

    private processChildFieldsToStorage(
        params: ProcessChildFieldsParams
    ): CmsEntryValues | undefined {
        const { fields, value, converterCollection } = params;

        if (value === undefined || value === null) {
            return undefined;
        }

        return fields.reduce<CmsEntryValues>((output, field) => {
            if (value[field.fieldId] === undefined) {
                return output;
            }
            const converter = converterCollection.getConverter(field.type);

            const newValue = converter.convertToStorage({
                field,
                value: value[field.fieldId],
                parent: field.parent
            });

            return {
                ...output,
                ...newValue
            };
        }, {});
    }

    public override convertFromStorage(params: ConvertParams): CmsEntryValues {
        const { field, value, converterCollection } = params;

        const childFields = this.getChildFields({
            field
        });
        if (childFields.length === 0) {
            return {};
        }

        if (field.multipleValues) {
            if (Array.isArray(value) === false) {
                return {
                    [field.fieldId]: null
                };
            }
            return {
                [field.fieldId]: value.map((itemValue: GenericRecord) => {
                    return this.processChildFieldsFromStorage({
                        fields: childFields.map(child => {
                            return {
                                ...child,
                                parent: field
                            };
                        }),
                        value: itemValue,
                        converterCollection
                    });
                })
            };
        }

        const values = this.processChildFieldsFromStorage({
            fields: childFields.map(child => {
                return {
                    ...child,
                    parent: field
                };
            }),
            value,
            converterCollection
        });

        if (values === undefined) {
            return {};
        }

        return {
            [field.fieldId]: values
        };
    }

    private processChildFieldsFromStorage(
        params: ProcessChildFieldsParams
    ): CmsEntryValues | undefined {
        const { fields, value, converterCollection } = params;

        if (value === undefined || value === null) {
            return undefined;
        }

        return fields.reduce<CmsEntryValues>((output, field) => {
            if (value[field.storageId] === undefined) {
                return output;
            }

            const converter = converterCollection.getConverter(field.type);

            const newValue = converter.convertFromStorage({
                field,
                value: value[field.storageId],
                parent: field.parent
            });
            if (!newValue) {
                return output;
            }

            return {
                ...output,
                ...newValue
            };
        }, {});
    }
}
