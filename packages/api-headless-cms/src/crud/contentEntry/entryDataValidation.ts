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
import camelCase from "lodash/camelCase";

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
    } else if (value == "" || value == null || value == undefined) {
        return null;
    }
    for (const predefinedValue of predefinedValues) {
        /**
         * No strict compare because the value sent can be 12345 (number) and predefinedValue can be "12345" (string),
         * and we want it to match.
         */
        if (predefinedValue.value == value) {
            return null;
        }
    }
    return "Value sent does not match any of the available predefined values.";
};

const getFieldValidation = (
    listValidation?: CmsModelFieldValidation[]
): CmsModelFieldValidation[] => {
    if (!listValidation?.length) {
        return [];
    }
    return listValidation.filter(item => item.name !== "dynamicZone");
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
    const valuesError = await validateValue(
        params,
        getFieldValidation(field.listValidation),
        values
    );
    if (valuesError) {
        return valuesError;
    }
    if (values === null || values === undefined) {
        return null;
    }
    for (const value of values) {
        const valueError = await validateValue(params, getFieldValidation(field.validation), value);
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
    skipValidators?: string[];
}

export const validateModelEntryData = async (params: ValidateModelEntryDataParams) => {
    const { context, model, entry, data, skipValidators } = params;

    const isValidatorSkipped = (plugin: CmsModelFieldValidatorPlugin) => {
        if (!skipValidators) {
            return false;
        }
        return skipValidators.includes(camelCase(plugin.validator.name));
    };

    const skippedValidators = new Set<string>();

    /**
     * To later simplify searching for the validations we map them to a name.
     * @see CmsModelFieldValidatorPlugin.validator.validate
     */
    const validatorList: PluginValidationList = {};
    const validators = context.plugins.byType<CmsModelFieldValidatorPlugin>(
        "cms-model-field-validator"
    );
    for (const plugin of validators) {
        const name = plugin.validator.name;
        if (!validatorList[name]) {
            validatorList[name] = [];
        }
        const isSkipped = isValidatorSkipped(plugin);
        if (isSkipped) {
            skippedValidators.add(name);
        }
        validatorList[name].push(isSkipped ? async () => true : plugin.validator.validate);
    }
    /**
     * No point in continuing if all validators are skipped.
     */
    const keys = Object.keys(validatorList);
    if (keys.length === skippedValidators.size) {
        return [];
    }

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

export const validateModelEntryDataOrThrow = async (params: ValidateModelEntryDataParams) => {
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
        const objectValue = params.data?.[field.fieldId];
        if (!objectValue) {
            return validations;
        }
        const values = Array.isArray(objectValue) ? objectValue : [objectValue];
        for (const index in values) {
            const parents = field.multipleValues ? [field.fieldId, index] : [field.fieldId];
            const value = values[index];
            for (const childField of fields) {
                const errors = await executeFieldValidation({
                    ...params,
                    parents: params.parents.concat(parents),
                    field: childField,
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
            const fieldData = params.data?.[field.fieldId];
            if (!fieldData) {
                continue;
            }
            const values = Array.isArray(fieldData) ? fieldData : [fieldData];
            for (const index in values) {
                const templateValue = values[index]?.[template.gqlTypeName];
                if (!templateValue) {
                    continue;
                }
                /**
                 * Order of the parents must be
                 * - fieldId
                 * - index (if multiple values)
                 * - gqlTypeName
                 */
                const parents = [field.fieldId];
                if (field.multipleValues) {
                    parents.push(index);
                }
                parents.push(template.gqlTypeName);
                for (const childField of fields) {
                    const errors = await executeFieldValidation({
                        ...params,
                        parents: params.parents.concat(parents),
                        field: childField,
                        data: templateValue
                    });
                    if (errors.length === 0) {
                        continue;
                    }
                    validations.push(...errors);
                }
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
