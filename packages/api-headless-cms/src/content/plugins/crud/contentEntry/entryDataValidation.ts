import {
    CmsContentModel,
    CmsContext,
    CmsModelFieldValidatorPlugin
} from "@webiny/api-headless-cms/types";

import Error from "@webiny/error";

export const validateModelEntryData = async (
    context: CmsContext,
    contentModel: CmsContentModel,
    data: Record<string, any>
) => {
    const plugins = context.plugins.byType<CmsModelFieldValidatorPlugin>(
        "cms-model-field-validator"
    );

    // To simplify access to validators, let's arrange them by name.
    const validatorsByName = plugins.reduce((acc, pl) => {
        acc[pl.validator.name] = pl.validator.validate;
        return acc;
    }, {});

    // Loop through model fields, and validate the corresponding data.
    // Run validation only if the field has validation configured.
    const invalidFields = [];
    for (let i = 0; i < contentModel.fields.length; i++) {
        const field = contentModel.fields[i];

        for (let i = 0; i < field.validation.length; i++) {
            const validator = field.validation[i];
            const validatorCallable = validatorsByName[validator.name];

            if (!validatorCallable || typeof validatorCallable !== "function") {
                continue;
            }

            const value = data[field.fieldId];

            let valid;
            try {
                // CMS validation plugins do not throw errors; they return a boolean.
                valid = await validatorCallable({ value, validator, context });
            } catch (e) {
                valid = false;
            }

            if (!valid) {
                invalidFields.push({
                    fieldId: field.fieldId,
                    error: validator.message || "Invalid value"
                });
            }
        }
    }

    if (invalidFields.length > 0) {
        throw new Error("Validation failed.", "VALIDATION_FAILED", invalidFields);
    }
};
