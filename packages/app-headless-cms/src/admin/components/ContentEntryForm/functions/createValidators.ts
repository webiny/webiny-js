import { plugins } from "@webiny/plugins";
import { CmsEditorField, CmsEditorFieldValidator, CmsModelFieldValidatorPlugin } from "~/types";
import { Validator } from "@webiny/validation/types";

export const createValidators = (
    field: CmsEditorField,
    validation: CmsEditorFieldValidator[]
): Validator[] => {
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

        const validator = async (value: any | any[]) => {
            let isInvalid;
            let message = item.message;
            try {
                const result = await validatorPlugin.validator.validate(value, item, field);
                isInvalid = result === false;
            } catch (e) {
                isInvalid = true;
                if (e.message && !item.message) {
                    message = e.message;
                }
            }

            if (isInvalid) {
                throw new Error(message || "Invalid value.");
            }
        };
        collection.push(validator);
        return collection;
    }, [] as Validator[]);
};
