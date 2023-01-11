import WebinyError from "@webiny/error";
import {
    CmsModelFieldConverterPlugin,
    ConvertParams
} from "~/plugins/CmsModelFieldConverterPlugin";
import { CmsDynamicZoneTemplate, CmsEntryValues, CmsModelDynamicZoneField } from "~/types";
import { ConverterCollection } from "~/utils/converters/ConverterCollection";

interface DynamicZoneValue {
    _templateId: string;
    [key: string]: any;
}

interface ProcessToStorage {
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
            if (!Array.isArray(value)) {
                throw new WebinyError(
                    `Dynamic zone field "${field.fieldId}" is expecting an array value.`,
                    "DYNAMIC_ZONE_EXPECTING_ARRAY_VALUE",
                    {
                        field,
                        value
                    }
                );
            }
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

        const processedValue = this.processToStorage({
            templates,
            converterCollection,
            value
        });
        return {
            [field.storageId]: processedValue
        };
    }

    private processToStorage(params: ProcessToStorage) {
        const { templates, value, converterCollection } = params;
        if (value === null || value === undefined) {
            return undefined;
        }

        const { _templateId } = value;

        const template = templates.find(t => t.id === _templateId);
        if (!template) {
            throw new WebinyError("Unknown template.", "UNKNOWN_TEMPLATE", {
                templateId: _templateId
            });
        }

        return template.fields.reduce<Record<string, any>>(
            (values, field) => {
                const converter = converterCollection.getConverter(field.type);
                const converted = converter.convertToStorage({
                    field,
                    value: value[field.fieldId]
                });
                Object.assign(values, converted);
                return values;
            },
            {
                _templateId
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
            if (!Array.isArray(value)) {
                throw new WebinyError(
                    `Dynamic zone field "${field.fieldId}" is expecting an array value.`,
                    "DYNAMIC_ZONE_EXPECTING_ARRAY_VALUE",
                    {
                        field,
                        value
                    }
                );
            }
            return {
                [field.fieldId]: value.map(item => {
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

    private processFromStorage(params: ProcessToStorage) {
        const { templates, value, converterCollection } = params;
        if (value === null || value === undefined) {
            return undefined;
        }

        const { _templateId } = value;

        const template = templates.find(t => t.id === _templateId);
        if (!template) {
            throw new WebinyError("Unknown template.", "UNKNOWN_TEMPLATE", {
                templateId: _templateId
            });
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
                _templateId
            }
        );
    }
}
