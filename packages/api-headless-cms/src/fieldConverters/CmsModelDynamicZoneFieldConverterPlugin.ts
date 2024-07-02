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
            const arrayValue = Array.isArray(value) ? value : [];

            return {
                [field.storageId]: arrayValue.map(item => {
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

    private processToStorage(params: ProcessValue) {
        const { templates, converterCollection } = params;
        let { value } = params;
        if (value === null || value === undefined) {
            return undefined;
        }
        /**
         * There are two ways converter needs to work:
         * 1. when there is a _templateId
         * 2. when there is a key which identifies which template is the data for
         */

        /**
         * When we have a template key, everything is simple.
         */
        const templateId = value._templateId;
        let graphQlName: string | undefined = undefined;
        let template: CmsDynamicZoneTemplate | undefined = undefined;
        if (templateId) {
            template = templates.find(t => {
                return templateId === t.id;
            });
        }
        /**
         * When we do not have a templateId, then the template identifier is the key of the value object.
         * But at that point, values under that key become the value we are working with later on.
         */
        //
        else {
            const keys = Object.keys(value);
            if (keys.length === 0) {
                return undefined;
            } else if (keys.length > 1) {
                throw new WebinyError(
                    "There cannot be more than one dynamic zone template in a single dynamic zone field.",
                    "DYNAMIC_ZONE_TOO_MANY_TEMPLATES",
                    {
                        templates: keys
                    }
                );
            }
            graphQlName = keys[0] as string;
            template = templates.find(t => t.gqlTypeName === graphQlName);
        }

        if (!template) {
            throw new WebinyError("Unknown template - converting to storage.", "UNKNOWN_TEMPLATE", {
                templateId,
                graphQlName
            });
        } else if (graphQlName) {
            value = value[graphQlName];
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
