import { plugins } from "@webiny/plugins";
import { CmsModelField, CmsModelFieldValidator, CmsModelFieldValidatorPlugin } from "~/types";
import { Validator } from "@webiny/validation/types";

interface FieldValidationErrorContext {
    validator: CmsModelFieldValidator;
    validatorPlugin: CmsModelFieldValidatorPlugin;
}

class FieldValidationError extends Error {
    private _context: FieldValidationErrorContext;

    constructor(message: string, context: FieldValidationErrorContext) {
        super(message);
        this._context = context;
    }

    get context() {
        return this._context;
    }
}

export const createValidators = (
    field: CmsModelField,
    validation: CmsModelFieldValidator[]
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
                let interpolated = message || "Invalid value.";

                const getVariableValues = validatorPlugin.validator.getVariableValues;
                if (typeof getVariableValues === "function") {
                    const variables = getVariableValues(item);

                    Object.keys(variables).forEach(key => {
                        const regex = new RegExp(`\{${key}\}`, "g");
                        interpolated = interpolated.replace(regex, variables[key]);
                    });
                }

                throw new FieldValidationError(interpolated, {
                    validator: item,
                    validatorPlugin
                });
            }
        };
        collection.push(validator);
        return collection;
    }, [] as Validator[]);
};
