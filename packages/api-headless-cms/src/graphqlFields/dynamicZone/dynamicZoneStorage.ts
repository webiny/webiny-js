import { CmsDynamicZoneTemplate, CmsModelDynamicZoneField } from "~/types";
import { StorageTransformPlugin } from "~/plugins";

const convertToStorage = (value: any, templates: CmsDynamicZoneTemplate[]) => {
    // Only one key is allowed in the input object.
    const inputType = Object.keys(value)[0];
    const template = templates.find(tpl => tpl.gqlTypeName === inputType);
    if (!template) {
        return undefined;
    }

    return { ...value[inputType], _templateId: template.id };
};

interface TemplateValueFromStorage {
    _templateId: string;
    [key: string]: any;
}

const convertFromStorage = (
    value: TemplateValueFromStorage,
    templates: CmsDynamicZoneTemplate[]
) => {
    if (value._templateId) {
        const template = templates.find(tpl => value._templateId === tpl.id);
        if (template) {
            // We keep the `_templateId` property, to simplify further processing.
            return { [template.gqlTypeName]: value };
        }

        return undefined;
    }

    // Let's also check if `value` is already in the desired shape.
    const template = templates.find(tpl => tpl.gqlTypeName in value);
    if (template) {
        return {
            [template.gqlTypeName]: { ...value[template.gqlTypeName], _templateId: template.id }
        };
    }

    return undefined;
};

export const createDynamicZoneStorageTransform = () => {
    return new StorageTransformPlugin<any, any, CmsModelDynamicZoneField>({
        fieldType: "dynamicZone",
        fromStorage: async ({ value, field }) => {
            if (!value) {
                return null;
            }

            const templates = field.settings.templates;

            if (Array.isArray(value) && field.multipleValues) {
                return value.map(value => convertFromStorage(value, templates)).filter(Boolean);
            }

            return convertFromStorage(value, templates);
        },
        toStorage: async ({ value, field }) => {
            if (!value) {
                return value;
            }

            const templates = field.settings.templates;

            if (Array.isArray(value) && field.multipleValues) {
                return value.map(value => convertToStorage(value, templates)).filter(Boolean);
            }

            return convertToStorage(value, templates);
        }
    });
};
