import {
    CmsModelFieldConverterPlugin,
    ConvertParams
} from "~/plugins/CmsModelFieldConverterPlugin";
import { CmsEntryValues, CmsModelFieldWithParent } from "~/types";
import { ConverterCollection } from "~/utils/converters/ConverterCollection";

interface ProcessChildFieldsParams {
    fields: CmsModelFieldWithParent[];
    value?: Record<string, any> | null;
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
            const childFields = this.getChildFields({
                field
            });

            if (childFields.length > 0) {
                if (field.multipleValues) {
                    if (Array.isArray(value[field.fieldId]) === false) {
                        return output;
                    }
                    const values = value[field.fieldId].map((childValue: any) => {
                        return converterCollection.convertToStorage({
                            fields: childFields.map(child => {
                                return {
                                    ...child,
                                    parent: field
                                };
                            }),
                            values: childValue
                        });
                    });
                    if (values === undefined) {
                        return output;
                    }
                    return {
                        ...output,
                        [field.storageId]: values
                    };
                }
                /**
                 * No need to process child fields if no value is provided.
                 */
                if (!value[field.fieldId]) {
                    return output;
                }
                const values = converterCollection.convertToStorage({
                    fields: childFields.map(child => {
                        return {
                            ...child,
                            parent: field
                        };
                    }),
                    values: value[field.fieldId]
                });
                if (values === undefined) {
                    return output;
                }
                return {
                    ...output,
                    [field.storageId]: values
                };
            }

            if (value[field.fieldId] === undefined) {
                return output;
            }

            return {
                ...output,
                [field.storageId]: value[field.fieldId]
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
            const childFields = this.getChildFields({
                field
            });

            if (childFields.length > 0) {
                if (field.multipleValues) {
                    const inputValues = value[field.storageId] as unknown as Record<string, any>[];
                    if (!inputValues || Array.isArray(inputValues) === false) {
                        return output;
                    }
                    const values = inputValues.map(childValue => {
                        return converterCollection.convertFromStorage({
                            fields: childFields.map(child => {
                                return {
                                    ...child,
                                    parent: field
                                };
                            }),
                            values: childValue
                        });
                    });
                    if (values === undefined) {
                        return output;
                    }
                    return {
                        ...output,
                        [field.fieldId]: values
                    };
                }
                /**
                 * No need to process child fields if no value is provided.
                 */
                if (!value[field.storageId]) {
                    return output;
                }
                const values = converterCollection.convertFromStorage({
                    fields: childFields.map(child => {
                        return {
                            ...child,
                            parent: field
                        };
                    }),
                    values: value[field.storageId]
                });
                if (values === undefined) {
                    return output;
                }
                return {
                    ...output,
                    [field.fieldId]: values
                };
            }

            if (value[field.storageId] === undefined) {
                return output;
            }
            return {
                ...output,
                [field.fieldId]: value[field.storageId]
            };
        }, {});
    }
}
