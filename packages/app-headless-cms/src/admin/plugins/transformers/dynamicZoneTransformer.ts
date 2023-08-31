import { CmsDynamicZoneTemplate, CmsFieldValueTransformer } from "~/types";
import { prepareFormData } from "@webiny/app-headless-cms-common";

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

    return {
        [template.gqlTypeName]: prepareFormData(value, template.fields)
    };
};

export const createDynamicZoneTransformer = (): CmsFieldValueTransformer => ({
    type: "cms-field-value-transformer",
    name: "cms-field-value-transformer-dynamic-zone",
    fieldType: "dynamicZone",
    transform: (value, field) => {
        const templates = field.settings?.templates || [];

        return value ? convertToGraphQLInput(value, templates) : undefined;
    }
});
