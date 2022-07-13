import {
    CmsModel,
    CmsModelField,
    CmsModelFieldValidation,
    CmsContext,
    CmsModelFieldValidatorPlugin,
    CmsModelFieldValidatorValidateParams,
    CmsEntry
} from "~/types";
import WebinyError from "@webiny/error";

type PluginValidationCallable = (params: CmsModelFieldValidatorValidateParams) => Promise<boolean>;
type PluginValidationList = Record<string, PluginValidationCallable[]>;
type InputData = Record<string, any>;

interface ValidateArgs {
    validatorList: PluginValidationList;
    field: CmsModelField;
    model: CmsModel;
    data: InputData;
    context: CmsContext;
    entry?: CmsEntry;
}

type PossibleValue = boolean | number | string | null | undefined;

const validateValue = async (
    args: ValidateArgs,
    fieldValidators: CmsModelFieldValidation[],
    value: PossibleValue | PossibleValue[]
): Promise<string | null> => {
    if (!fieldValidators) {
        return null;
    }

    const { validatorList, context, field, model, entry } = args;
    try {
        for (const fieldValidator of fieldValidators) {
            const name = fieldValidator.name;
            const validations = validatorList[name];
            if (!validations || validations.length === 0) {
                return `There are no "${name}" validators defined.`;
            }
            for (const validate of validations) {
                const result = await validate({
                    value,
                    context,
                    validator: fieldValidator,
                    field,
                    model,
                    entry
                });
                if (!result) {
                    return fieldValidator.message;
                }
            }
        }
    } catch (ex) {
        return ex.message;
    }

    return null;
};

const validatePredefinedValue = (field: CmsModelField, value: any | any[]): string | null => {
    const { enabled = false, values: predefinedValues = [] } = field.predefinedValues || {};
    if (!enabled) {
        return null;
    } else if (Array.isArray(predefinedValues) === false || predefinedValues.length === 0) {
        return "Missing predefined values to validate against.";
    }
    for (const predefinedValue of predefinedValues) {
        if (predefinedValue.value == value) {
            return null;
        }
    }
    return "Value sent does not match any of the available predefined values.";
};
/**
 * When multiple values is selected we must run validations on the array containing the values
 * And then on each value in the array
 */
const runFieldMultipleValuesValidations = async (args: ValidateArgs): Promise<string | null> => {
    const { field, data } = args;
    const values = data[field.fieldId] || [];
    if (Array.isArray(values) === false) {
        return `Value of the field "${field.fieldId}" is not an array.`;
    }
    const valuesError = await validateValue(args, field.listValidation || [], values);
    if (valuesError) {
        return valuesError;
    }
    for (const value of values) {
        const valueError = await validateValue(args, field.validation || [], value);
        if (valueError) {
            return valueError;
        }
        const predefinedValueError = validatePredefinedValue(field, value);
        if (predefinedValueError) {
            return predefinedValueError;
        }
    }
    return null;
};
/**
 * Runs validation on given value.
 */
const runFieldValueValidations = async (args: ValidateArgs): Promise<string | null> => {
    const { data, field } = args;
    const value = data[field.fieldId];
    const error = await validateValue(args, field.validation || [], value);
    if (error) {
        return error;
    }
    return validatePredefinedValue(field, value);
};

const execValidation = async (args: ValidateArgs): Promise<string | null> => {
    if (args.field.multipleValues) {
        return await runFieldMultipleValuesValidations(args);
    }
    return await runFieldValueValidations(args);
};

export interface ValidateModelEntryDataParams {
    context: CmsContext;
    model: CmsModel;
    data: InputData;
    entry?: CmsEntry;
}
export const validateModelEntryData = async (params: ValidateModelEntryDataParams) => {
    const { context, model, entry, data } = params;
    /**
     * To later simplify searching for the validations we map them to a name.
     * @see CmsModelFieldValidatorPlugin.validator.validate
     */
    const validatorList: PluginValidationList = context.plugins
        .byType<CmsModelFieldValidatorPlugin>("cms-model-field-validator")
        .reduce((acc, plugin) => {
            const name = plugin.validator.name;
            if (!acc[name]) {
                acc[name] = [];
            }
            acc[name].push(plugin.validator.validate);

            return acc;
        }, {} as PluginValidationList);

    /**
     * Loop through model fields and validate the corresponding data.
     * Run validation only if the field has validation configured.
     */
    const invalidFields = [];
    for (const field of model.fields) {
        const error = await execValidation({
            model,
            validatorList,
            field,
            data: {
                ...(entry?.values || {}),
                ...data
            },
            context,
            entry
        });
        if (!error) {
            continue;
        }
        invalidFields.push({
            fieldId: field.fieldId,
            error
        });
    }

    if (invalidFields.length > 0) {
        throw new WebinyError("Validation failed.", "VALIDATION_FAILED", invalidFields);
    }
};
