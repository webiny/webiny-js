import WebinyError from "@webiny/error";
import {
    CmsModelFieldConverterPlugin,
    ConvertParams
} from "~/plugins/CmsModelFieldConverterPlugin";
import { CmsDynamicZoneTemplate, CmsEntryValues, CmsModelDynamicZoneField } from "~/types";
import { ConverterCollection } from "~/utils/converters/ConverterCollection";

interface DynamicZoneValue {
    [key: string]: any;
}

interface ProcessValue {
    templates: CmsDynamicZoneTemplate[];
    value: DynamicZoneValue | null;
    converterCollection: ConverterCollection;
}

export class CmsModelDynamicZoneFieldConverterPlugin extends CmsModelFieldConverterPlugin {
    public override name = "cms.field.converter.dynamicZone";

    public override getFieldType(): string {
        return "dynamicZone";
    }

    private getTemplates(field: CmsModelDynamicZoneField): CmsDynamicZoneTemplate[] {
        return field.settings?.templates || [];
    }

    public override convertToStorage(
        params: ConvertParams<CmsModelDynamicZoneField>
    ): CmsEntryValues {
        const { field, value, converterCollection } = params;

        const templates = this.getTemplates(field);

        if (templates.length === 0) {
            return {};
        }

        if (field.multipleValues) {
            if (Array.isArray(value)) {
                return {
                    [field.storageId]: value.map(item => {
                        return this.processToStorage({
                            templates,
                            converterCollection,
                            value: item
                        });
                    })
                };
            }

            // If a multi-value dynamic zone receives anything other than an array, ignore the value.
            return {};
        }

        // If a single-value dynamic zone receives an array, ignore the value.
        if (Array.isArray(value)) {
            return {};
        }

        const processedValue = this.processToStorage({
            templates,
            converterCollection,
            value
        });

        return {
            [field.storageId]: processedValue
        };
    }

    private processToStorage(params: ProcessValue) {
        const { templates, converterCollection } = params;
        const { value } = params;
        if (value === null || value === undefined) {
            return undefined;
        }

        const templateId = value._templateId;
        const template = templates.find(t => {
            return templateId === t.id;
        });

        if (!template) {
            return undefined;
        }

        return template.fields.reduce<Record<string, any>>(
            (values, field) => {
                const converter = converterCollection.getConverter(field.type);
                const converted = converter.convertToStorage({
                    field,
                    value: value ? value[field.fieldId] : undefined
                });
                Object.assign(values, converted);
                return values;
            },
            {
                _templateId: template.id
            }
        );
    }

    public override convertFromStorage(
        params: ConvertParams<CmsModelDynamicZoneField>
    ): CmsEntryValues {
        const { field, value, converterCollection } = params;

        const templates = this.getTemplates(field);

        if (templates.length === 0) {
            return {};
        }

        if (field.multipleValues) {
            const arrayValue = Array.isArray(value) ? value : [];

            return {
                [field.fieldId]: arrayValue.map(item => {
                    return this.processFromStorage({
                        templates,
                        converterCollection,
                        value: item
                    });
                })
            };
        }

        if (Array.isArray(value)) {
            throw new WebinyError(
                `Dynamic zone field "${field.fieldId}" is expecting a non-array value.`,
                "DYNAMIC_ZONE_EXPECTING_NON_ARRAY_VALUE",
                {
                    field,
                    value
                }
            );
        }

        const processedValue = this.processFromStorage({
            templates,
            converterCollection,
            value
        });

        return {
            [field.fieldId]: processedValue
        };
    }

    private processFromStorage(params: ProcessValue) {
        const { templates, value, converterCollection } = params;
        if (value === null || value === undefined) {
            return undefined;
        }

        const { _templateId } = value;

        const template = templates.find(t => t.id === _templateId);
        if (!template) {
            throw new WebinyError(
                "Unknown template - converting from storage.",
                "UNKNOWN_TEMPLATE",
                {
                    templateId: _templateId
                }
            );
        }

        return template.fields.reduce<Record<string, any>>(
            (values, field) => {
                const converter = converterCollection.getConverter(field.type);
                const converted = converter.convertFromStorage({
                    field,
                    value: value[field.storageId]
                });
                Object.assign(values, converted);
                return values;
            },
            {
                _templateId: template.id
            }
        );
    }
}
