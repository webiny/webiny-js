import { CmsDynamicZoneTemplate, CmsModelDynamicZoneField } from "~/types";
import { StorageTransformPlugin } from "~/plugins";
import { createTypeName } from "~/utils/createTypeName";

const convertToStorage = (value: any, templates: CmsDynamicZoneTemplate[]) => {
    // Only one key is allowed in the input object.
    const inputType = Object.keys(value)[0];
    const template = templates.find(tpl => createTypeName(tpl.name) === inputType);
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
    const template = templates.find(tpl => value._templateId === tpl.id);
    if (!template) {
        return undefined;
    }

    const templateTypeName = createTypeName(template.name);

    // We keep the `_templateId` property, to simplify further processing.
    return { [templateTypeName]: value };
};

export const dynamicZoneFieldStorage = new StorageTransformPlugin<
    any,
    any,
    CmsModelDynamicZoneField
>({
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
