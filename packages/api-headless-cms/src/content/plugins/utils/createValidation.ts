import {
    CmsContext,
    CmsContentModelField,
    CmsModelFieldValidatorPlugin
} from "@webiny/api-headless-cms/types";
import { getI18NValue } from "./getI18NValue";

export const createValidation = (field: CmsContentModelField, context: CmsContext) => {
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
                throw new Error(getI18NValue(validator.message) || "Invalid value.");
            }
        }

        return true;
    };
};
