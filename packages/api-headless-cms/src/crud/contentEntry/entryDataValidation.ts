import {
    CmsContext,
    CmsDynamicZoneTemplate,
    CmsEntry,
    CmsModel,
    CmsModelField,
    CmsModelFieldValidation,
    CmsModelFieldValidatorPlugin,
    CmsModelFieldValidatorValidateParams
} from "~/types";
import WebinyError from "@webiny/error";

type PluginValidationCallable = (params: CmsModelFieldValidatorValidateParams) => Promise<boolean>;
type PluginValidationList = Record<string, PluginValidationCallable[]>;
type InputData = Record<string, any>;

interface ExecuteValidationParams {
    validatorList: PluginValidationList;
    field: CmsModelField;
    model: CmsModel;
    data: InputData;
    context: CmsContext;
    entry?: CmsEntry;
}

type PossibleValue = boolean | number | string | null | undefined;

const validateValue = async (
    params: ExecuteValidationParams,
    fieldValidators: CmsModelFieldValidation[],
    value: PossibleValue | PossibleValue[]
): Promise<string | null> => {
    if (!fieldValidators) {
        return null;
    }

    const { validatorList, context, field, model, entry } = params;
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
const runFieldMultipleValuesValidations = async (
    params: ExecuteValidationParams
): Promise<string | null> => {
    const { field, data } = params;
    const values = data[field.fieldId] || [];
    if (Array.isArray(values) === false) {
        return `Value of the field "${field.fieldId}" is not an array.`;
    }
    const valuesError = await validateValue(params, field.listValidation || [], values);
    if (valuesError) {
        return valuesError;
    }
    for (const value of values) {
        const valueError = await validateValue(params, field.validation || [], value);
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
const runFieldValueValidations = async (
    params: ExecuteValidationParams
): Promise<string | null> => {
    const { data, field } = params;
    const value = data[field.fieldId];
    const error = await validateValue(params, field.validation || [], value);
    if (error) {
        return error;
    }
    return validatePredefinedValue(field, value);
};

const execValidation = async (params: ExecuteValidationParams): Promise<string | null> => {
    if (params.field.multipleValues) {
        return await runFieldMultipleValuesValidations(params);
    }
    return await runFieldValueValidations(params);
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

    return await validate({
        validatorList,
        context,
        model,
        entry,
        fields: model.fields,
        data: {
            ...entry?.values,
            ...data
        }
    });
};

export const throwValidateModelEntryData = async (params: ValidateModelEntryDataParams) => {
    const invalidFields = await validateModelEntryData(params);
    if (invalidFields.length === 0) {
        return;
    }
    throw new WebinyError("Validation failed.", "VALIDATION_FAILED", invalidFields);
};

/**
 *
 */
interface FieldError {
    id: string;
    fieldId: string;
    storageId: string;
    error: any;
}

interface ValidateParams {
    validatorList: PluginValidationList;
    model: CmsModel;
    data: InputData;
    context: CmsContext;
    fields: CmsModelField[];
    entry?: CmsEntry;
}

const executeFieldValidation = async (
    params: Omit<ValidateParams, "fields"> & {
        field: CmsModelField;
    }
): Promise<FieldError[]> => {
    // TODO put per-field validation into plugins.
    /**
     * Object field.
     */
    if (params.field.type === "object" && params.field.settings?.fields) {
        const fields = params.field.settings?.fields;
        if (!Array.isArray(fields)) {
            return [];
        }
        const validations: FieldError[] = [];
        for (const field of fields) {
            const data = params.data?.[field.fieldId];
            const defaultValue = field.multipleValues ? [] : {};
            const errors = await executeFieldValidation({
                ...params,
                field,
                data: data || defaultValue
            });
            if (errors.length === 0) {
                continue;
            }
            validations.push(...errors);
        }
        return validations;
    }
    /**
     * Dynamic Zone Field
     */
    //
    else if (params.field.type === "dynamicZone") {
        const validations: FieldError[] = [];
        const templates = (params.field.settings?.templates || []) as CmsDynamicZoneTemplate[];
        for (const template of templates) {
            const fields = template.fields;
            const data = params.data?.[params.field.fieldId] as any[];
            if (!Array.isArray(data)) {
                continue;
            }
            const templateValue = data.find(value => {
                return value && !!value[template.gqlTypeName];
            });
            if (!templateValue) {
                continue;
            }
            const value = templateValue[template.gqlTypeName] || {};
            for (const field of fields) {
                const defaultValue = field.multipleValues ? [] : {};
                const errors = await executeFieldValidation({
                    ...params,
                    field,
                    data: value || defaultValue
                });
                if (errors.length === 0) {
                    continue;
                }
                validations.push(...errors);
            }
        }

        return validations;
    }
    const error = await execValidation({
        ...params
    });
    if (!error) {
        return [];
    }
    return [
        {
            id: params.field.id,
            fieldId: params.field.fieldId,
            storageId: params.field.storageId,
            error
        }
    ];
};

const validate = async (params: ValidateParams): Promise<any[]> => {
    const { fields } = params;
    const errors: FieldError[] = [];
    for (const field of fields) {
        const results = await executeFieldValidation({
            ...params,
            field
        });
        if (results.length === 0) {
            continue;
        }
        errors.push(...results);
    }
    return errors;
};
