import { CmsDynamicZoneTemplate, CmsModelDynamicZoneField } from "~/types";
import { StorageTransformPlugin } from "~/plugins";

function valueWithTemplateId(
    value: Record<string, any>,
    { id, gqlTypeName }: CmsDynamicZoneTemplate
) {
    return { [gqlTypeName]: { ...value[gqlTypeName], _templateId: id } };
}

const convertToStorage = (value: Record<string, any>, templates: CmsDynamicZoneTemplate[]) => {
    // Only one key is allowed in the input object.
    const inputType = Object.keys(value)[0];
    const template = templates.find(tpl => tpl.gqlTypeName === inputType);
    if (template) {
        return { ...value[inputType], _templateId: template.id };
    }
    /**
     * There is a possibility that the value is already in the storage format, so there is no need to transform it again.
     * We are going to check:
     * 1. value is an object
     * 2. it contains a _templateId key
     * 3. the key is a valid template id - at this point we know it is already converted
     */
    if (!value || typeof value !== "object") {
        return undefined;
    } else if (!value._templateId) {
        return undefined;
    }
    const tpl = templates.find(tpl => tpl.id === value._templateId);
    return tpl ? value : undefined;
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

    if (template) {
        // We keep the `_templateId` property, to simplify further processing.
        return { [template.gqlTypeName]: value };
    }

    /**
     * When the `value` is in the original input format (during GraphQL mutations), `_templateId` will not be present
     * in the `value` object (because this internal property is added by `toStorage` storage transform method, and since
     * we simply return the input from the CRUD methods, this property will be missing).
     * For that reason, we need to run some extra logic, to acquire the `_templateId`.
     */

    if (!value || typeof value !== "object") {
        return undefined;
    }

    /**
     * `value` object must have exactly one none-empty key.
     */
    const keys = Object.keys(value);
    if (keys.length !== 1 || !keys[0]) {
        return undefined;
    }

    /**
     * Find a template that matches the first (and only) key of the `value` object by template's `gqlTypeName`.
     */
    const tpl = templates.find(tpl => tpl.gqlTypeName === keys[0]);
    return tpl ? valueWithTemplateId(value, tpl) : undefined;
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
