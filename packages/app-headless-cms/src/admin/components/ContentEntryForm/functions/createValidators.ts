import { plugins } from "@webiny/plugins";
import { CmsEditorFieldValidator, CmsModelFieldValidatorPlugin } from "~/types";
import { Validator } from "@webiny/validation/types";

export const createValidators = (validation: CmsEditorFieldValidator[]): Validator[] => {
    const validatorPlugins = plugins.byType<CmsModelFieldValidatorPlugin>(
        "cms-model-field-validator"
    );

    return validation.reduce((collection, item) => {
        const validatorPlugin = validatorPlugins.find(
            plugin => plugin.validator.name === item.name
        );

        if (!validatorPlugin || typeof validatorPlugin.validator.validate !== "function") {
            return collection;
        }

        const validator = async (value: string | string[]) => {
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
        collection.push(validator);
        return collection;
    }, [] as Validator[]);
};
