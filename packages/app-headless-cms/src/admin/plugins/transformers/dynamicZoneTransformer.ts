import { CmsDynamicZoneTemplate, CmsFieldValueTransformer } from "~/types";

interface TemplateValueFromForm {
    _templateId: string;
    [key: string]: any;
}

const convertToGraphQLInput = (
    { _templateId, ...value }: TemplateValueFromForm,
    templates: CmsDynamicZoneTemplate[]
) => {
    const template = templates.find(tpl => _templateId === tpl.id);
    if (!template) {
        return undefined;
    }

    // We keep the `_templateId` property, to simplify further processing.
    return { [template.gqlTypeName]: value };
};

export const createDynamicZoneTransformer = (): CmsFieldValueTransformer => ({
    type: "cms-field-value-transformer",
    name: "cms-field-value-transformer-dynamic-zone",
    fieldType: "dynamicZone",
    transform: (value, field) => {
        const templates = field.settings?.templates || [];

        return value ? convertToGraphQLInput(value, templates) : null;
    }
});
