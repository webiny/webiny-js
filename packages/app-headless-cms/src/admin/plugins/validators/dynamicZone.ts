import { CmsModelFieldValidatorPlugin } from "~/types";
import { createValidators } from "~/admin/components/ContentEntryForm/functions/createValidators";

interface TemplateValue {
    __template: string;
    [key: string]: any;
}

export const dynamicZoneValidator: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-dynamic-zone",
    validator: {
        name: "dynamicZone",
        validate: async (value: TemplateValue[], _, field) => {
            const templates = field.settings?.templates || [];
            for (const template of templates) {
                const validationRules = template.validation || [];
                const templateValue = value.filter(v => v.__template === template.id);
                const validators = createValidators(field, validationRules);
                for (const validator of validators) {
                    await validator(templateValue);
                }
            }
        }
    }
};
