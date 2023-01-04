import { CmsModelFieldValidatorPlugin } from "~/types";
import { createValidators } from "~/admin/components/ContentEntryForm/functions/createValidators";

interface TemplateValue {
    _templateId: string;
    [key: string]: any;
}

export const dynamicZoneValidator: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-dynamic-zone",
    validator: {
        name: "dynamicZone",
        validate: async (value: TemplateValue[], _, field) => {
            // This validator only runs for Dynamic Zone fields with `multipleValues=true`.
            const templates = field.settings?.templates || [];
            for (const template of templates) {
                const validationRules = template.validation || [];
                const templateValue = (value || []).filter(v => v._templateId === template.id);
                const validators = createValidators(field, validationRules);
                for (const validator of validators) {
                    await validator(templateValue);
                }
            }
        }
    }
};
