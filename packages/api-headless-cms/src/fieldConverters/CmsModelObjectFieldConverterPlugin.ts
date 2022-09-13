import {
    CmsModelFieldConverterPlugin,
    ConvertParams
} from "~/plugins/CmsModelFieldConverterPlugin";
import { CmsEntryValues, CmsModelFieldWithParent } from "~/types";
import lodashGet from "lodash.get";
import { ConverterCollection } from "~/utils/converters/ConverterCollection";

interface ProcessChildFieldsParams {
    fields: CmsModelFieldWithParent[];
    value: any;
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
        if (!field?.settings) {
            return [];
        }
        return field.settings.fields || [];
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
                    [field.storageId]: []
                };
            }
            return {
                [field.storageId]: value.map((itemValue: any) => {
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

        return {
            [field.storageId]: values
        };
    }

    private processChildFieldsToStorage(params: ProcessChildFieldsParams): CmsEntryValues {
        const { fields, value, converterCollection } = params;
        let output: CmsEntryValues = {};
        for (const field of fields) {
            const childFields = field.settings?.fields;

            if (childFields) {
                const values = converterCollection.convertToStorage({
                    fields: (field.settings?.fields || []).map(child => {
                        return {
                            ...child,
                            parent: field
                        };
                    }),
                    values: lodashGet(value, `${field.fieldId}`, {})
                });
                output = {
                    ...output,
                    [field.storageId]: values
                };
                continue;
            }

            output = {
                ...output,
                [field.storageId]: value[field.fieldId]
            };
        }
        return output;
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
                    [field.fieldId]: []
                };
            }
            return {
                [field.fieldId]: value.map((itemValue: any) => {
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

        return {
            [field.fieldId]: values
        };
    }

    private processChildFieldsFromStorage(params: ProcessChildFieldsParams): CmsEntryValues {
        const { fields, value, converterCollection } = params;
        let output: CmsEntryValues = {};
        for (const field of fields) {
            const childFields = field.settings?.fields;

            if (childFields) {
                const values = converterCollection.convertFromStorage({
                    fields: (field.settings?.fields || []).map(child => {
                        return {
                            ...child,
                            parent: field
                        };
                    }),
                    values: lodashGet(value, `${field.storageId}`, {})
                });
                output = {
                    ...output,
                    [field.fieldId]: values
                };
                continue;
            }

            output = {
                ...output,
                [field.fieldId]: value[field.storageId]
            };
        }
        return output;
    }
}
