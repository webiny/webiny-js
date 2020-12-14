import { CmsContext, CmsContentModelFieldType, CmsModelFieldValidatorPlugin } from "../../../types";

export const createValidation = (field: CmsContentModelFieldType, context: CmsContext) => {
    const plugins = context.plugins.byType<CmsModelFieldValidatorPlugin>(
        "cms-model-field-validator"
    );

    return async value => {
        for (let i = 0; i < field.validation.length; i++) {
            const validator = field.validation[i];
            const validatorPlugin = plugins.find(
                plugin => plugin.validator.name === validator.name
            );

            if (!validatorPlugin || typeof validatorPlugin.validator.validate !== "function") {
                continue;
            }

            let valid = false;
            try {
                valid = await validatorPlugin.validator.validate({ value, validator, context });
            } catch (e) {
                valid = false;
            }

            if (!valid) {
                throw new Error(validator.message || "Invalid value.");
            }
        }

        return true;
    };
};
