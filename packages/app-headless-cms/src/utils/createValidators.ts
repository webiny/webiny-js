import { plugins } from "@webiny/plugins";
import { CmsModelField, CmsModelFieldValidator, CmsModelFieldValidatorPlugin } from "~/types";
import { Validator } from "@webiny/validation/types";
import camelCase from "lodash/camelCase";

export const createValidators = (
    field: CmsModelField,
    validation: (CmsModelFieldValidator | Validator)[]
): Validator[] => {
    const validatorPlugins = plugins.byType<CmsModelFieldValidatorPlugin>(
        "cms-model-field-validator"
    );

    return validation.reduce<Validator[]>((collection, item) => {
        if (typeof item === "function") {
            return [...collection, item];
        }

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
                const result = await validatorPlugin.validator.validate(value, {
                    validator: item,
                    field
                });

                isInvalid = result === false;
            } catch (e) {
                isInvalid = true;
                if (e.message && !item.message) {
                    message = e.message;
                }
            }

            if (isInvalid) {
                let interpolated = message || "Invalid value.";

                const getVariableValues = validatorPlugin.validator.getVariableValues;
                if (typeof getVariableValues === "function") {
                    const variables = getVariableValues({ validator: item });

                    Object.keys(variables).forEach(key => {
                        const regex = new RegExp(`\{${key}\}`, "g");
                        interpolated = interpolated.replace(regex, variables[key]);
                    });
                }

                throw new Error(interpolated);
            }
        };
        /**
         * We need to set the validator name because it will be used as the reference to skip, if necessary.
         */
        validator.validatorName = camelCase(validatorPlugin.validator.name);

        collection.push(validator);
        return collection;
    }, [] as Validator[]);
};
