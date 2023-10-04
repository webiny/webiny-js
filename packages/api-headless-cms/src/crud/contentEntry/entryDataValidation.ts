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
    const values = data?.[field.fieldId];
    const valuesError = await validateValue(params, field.listValidation || [], values);
    if (valuesError) {
        return valuesError;
    }
    if (!values) {
        return null;
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
    const { field } = params;
    if (field.multipleValues) {
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
        parents: [],
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
    parents: string[];
}

interface GetObjectValueParams {
    field: CmsModelField;
    data: any;
}

const getObjectValue = (params: GetObjectValueParams) => {
    const { field, data } = params;
    if (field.multipleValues) {
        if (!Array.isArray(data)) {
            return [];
        }
        return data || [];
    }
    return data || {};
};
interface GetTemplateValueParams {
    field: CmsModelField;
    template: CmsDynamicZoneTemplate;
    data: any;
}
const getTemplateValue = (params: GetTemplateValueParams) => {
    const { field, template, data } = params;
    if (field.multipleValues) {
        if (!Array.isArray(data)) {
            return undefined;
        }
        return data
            .filter(value => {
                return !!value?.[template.gqlTypeName];
            })
            .map(value => value[template.gqlTypeName]);
    }
    return data?.[template.gqlTypeName];
};

interface ValidateParams {
    validatorList: PluginValidationList;
    parents: string[];
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
    const { field } = params;
    /**
     * Object field.
     */
    if (field.type === "object") {
        const fields = field.settings?.fields;
        if (!Array.isArray(fields)) {
            return [];
        }
        const validations: FieldError[] = [];
        /**
         * We need to validate the object field as well.
         */
        const error = await execValidation({
            ...params,
            field
        });
        if (error) {
            validations.push({
                id: field.id,
                fieldId: field.fieldId,
                storageId: field.storageId,
                error,
                parents: params.parents
            });
        }
        const data = params.data?.[field.fieldId];
        if (!data) {
            return validations;
        }

        const value = getObjectValue({
            field,
            data
        });

        for (const childField of fields) {
            const errors = await executeFieldValidation({
                ...params,
                parents: params.parents.concat([field.fieldId]),
                field: {
                    ...childField,
                    multipleValues: field.multipleValues
                },
                data: value
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
    else if (field.type === "dynamicZone") {
        const validations: FieldError[] = [];

        const error = await execValidation({
            ...params,
            field
        });
        if (error) {
            validations.push({
                id: field.id,
                fieldId: field.fieldId,
                storageId: field.storageId,
                error,
                parents: params.parents
            });
        }

        const templates = (field.settings?.templates || []) as CmsDynamicZoneTemplate[];
        for (const template of templates) {
            const fields = template.fields;
            const data = params.data?.[field.fieldId];
            const value = getTemplateValue({
                field,
                template,
                data
            });
            if (!value) {
                continue;
            }
            for (const childField of fields) {
                const errors = await executeFieldValidation({
                    ...params,
                    parents: params.parents.concat([field.fieldId]),
                    field: {
                        ...childField,
                        multipleValues: field.multipleValues
                    },
                    data: value
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
            id: field.id,
            fieldId: field.fieldId,
            storageId: field.storageId,
            error,
            parents: params.parents
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
