import type { CmsDynamicZoneTemplate, CmsFieldValueTransformer } from "~/types.js";
import { prepareFormData } from "@webiny/app-headless-cms-common";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";

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

    const entry: Required<Pick<CmsContentEntry, "values">> = {
        values: prepareFormData(value, template.fields)
    };

    return {
        [template.gqlTypeName]: entry
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
