import { plugins } from "@webiny/plugins";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createValidators = validation => {
    const validatorPlugins = plugins.byType<CmsModelFieldValidatorPlugin>(
        "cms-model-field-validator"
    );

    return validation
        .map(item => {
            const validatorPlugin = validatorPlugins.find(
                plugin => plugin.validator.name === item.name
            );

            if (!validatorPlugin || typeof validatorPlugin.validator.validate !== "function") {
                return;
            }

            return async value => {
                let isInvalid;
                try {
                    const result = await validatorPlugin.validator.validate(value, item);
                    isInvalid = result === false;
                } catch (e) {
                    isInvalid = true;
                }

                if (isInvalid) {
                    throw new Error(item.message || "Invalid value.");
                }
            };
        })
        .filter(Boolean);
};
