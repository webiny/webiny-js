import type {
    CmsContext,
    CmsDynamicZoneTemplate,
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsModelField,
    CmsModelFieldValidation,
    CmsModelFieldValidatorValidateParams
} from "~/types/index.js";
import camelCase from "lodash/camelCase.js";
import { EntryValidationError } from "~/domain/contentEntry/errors.js";
import {
    type CmsModelFieldValidator,
    CmsModelFieldValidatorRegistry
} from "~/features/validation/index.js";

type PluginValidationCallable = (params: CmsModelFieldValidatorValidateParams) => Promise<boolean>;
type PluginValidationList = Record<string, PluginValidationCallable[]>;

interface ExecuteValidationParams<TValues extends CmsEntryValues = CmsEntryValues> {
    validatorList: PluginValidationList;
    field: CmsModelField;
    model: CmsModel;
    values: TValues;
    context: CmsContext;
    entry?: CmsEntry<TValues>;
}

type PossibleValue = boolean | number | string | null | undefined;

const validateValue = async <TValues extends CmsEntryValues = CmsEntryValues>(
    params: ExecuteValidationParams<TValues>,
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
    } else if (value === "" || value === null || value === undefined) {
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
const runFieldMultipleValuesValidations = async <TValues extends CmsEntryValues = CmsEntryValues>(
    params: ExecuteValidationParams<TValues>
): Promise<string | null> => {
    const { field, values: initialValues } = params;
    const values = initialValues[field.fieldId as keyof TValues] as
        | PossibleValue[]
        | null
        | undefined;
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
const runFieldValueValidations = async <TValues extends CmsEntryValues = CmsEntryValues>(
    params: ExecuteValidationParams<TValues>
): Promise<string | null> => {
    const { values, field } = params;
    const value = values[field.fieldId as keyof TValues] as PossibleValue | null | undefined;
    const error = await validateValue(params, field.validation || [], value);
    if (error) {
        return error;
    }
    return validatePredefinedValue(field, value);
};

const execValidation = async (params: ExecuteValidationParams): Promise<string | null> => {
    const { field } = params;
    if (field.list) {
        return await runFieldMultipleValuesValidations(params);
    }
    return await runFieldValueValidations(params);
};

interface IValidateModelEntryDataParams<TValues extends CmsEntryValues = CmsEntryValues> {
    context: CmsContext;
    model: CmsModel;
    values: TValues;
    entry?: CmsEntry<TValues>;
    skipValidators?: string[];
}

export const validateModelEntryData = async <TValues extends CmsEntryValues = CmsEntryValues>(
    params: IValidateModelEntryDataParams<TValues>
) => {
    const { context, model, entry, values, skipValidators } = params;

    const isValidatorSkipped = (validator: CmsModelFieldValidator.Interface) => {
        if (!skipValidators) {
            return false;
        }
        return skipValidators.includes(camelCase(validator.name));
    };

    const skippedValidators = new Set<string>();

    const validatorList: PluginValidationList = {};
    const registry = context.container.resolve(CmsModelFieldValidatorRegistry);
    const validators = registry.getAll();
    for (const validator of validators) {
        const name = validator.name;
        if (!validatorList[name]) {
            validatorList[name] = [];
        }
        const isSkipped = isValidatorSkipped(validator);
        if (isSkipped) {
            skippedValidators.add(name);
        }
        validatorList[name].push(
            isSkipped ? async () => true : params => validator.validate(params)
        );
    }
    /**
     * No point in continuing if all validators are skipped.
     */
    const keys = Object.keys(validatorList);
    if (keys.length === skippedValidators.size) {
        return [];
    }

    return await validate<TValues>({
        validatorList,
        context,
        model,
        entry,
        parents: [],
        fields: model.fields,
        values: {
            ...entry?.values,
            ...values
        }
    });
};

export const validateModelEntryDataOrThrow = async <
    TValues extends CmsEntryValues = CmsEntryValues
>(
    params: IValidateModelEntryDataParams<TValues>
) => {
    const invalidFields = await validateModelEntryData(params);
    if (invalidFields.length === 0) {
        return;
    }
    throw new EntryValidationError("Validation failed.", invalidFields);
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

interface ValidateFieldParams<TValues extends CmsEntryValues = CmsEntryValues> {
    validatorList: PluginValidationList;
    parents: string[];
    model: CmsModel;
    values: TValues;
    context: CmsContext;
    field: CmsModelField;
    entry?: CmsEntry<TValues>;
}

const executeFieldValidation = async <TValues extends CmsEntryValues = CmsEntryValues>(
    params: ValidateFieldParams<TValues>
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
        const objectValue = params.values[field.fieldId as keyof TValues];
        if (!objectValue) {
            return validations;
        }
        const values = (Array.isArray(objectValue) ? objectValue : [objectValue]) as TValues[];
        for (const index in values) {
            const parents = field.list ? [field.fieldId, index] : [field.fieldId];
            const value = values[index] as TValues;
            for (const childField of fields) {
                const errors = await executeFieldValidation<typeof value>({
                    ...params,
                    parents: params.parents.concat(parents),
                    field: childField,
                    values: value
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
            const fieldData = params.values[field.fieldId as keyof TValues];
            if (!fieldData) {
                continue;
            }
            const values: TValues[keyof TValues][] = Array.isArray(fieldData)
                ? fieldData
                : [fieldData];
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
                if (field.list) {
                    parents.push(index);
                }
                parents.push(template.gqlTypeName);
                for (const childField of fields) {
                    const errors = await executeFieldValidation({
                        ...params,
                        parents: params.parents.concat(parents),
                        field: childField,
                        values: templateValue
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

interface ValidateFieldsParams<TValues extends CmsEntryValues = CmsEntryValues> {
    validatorList: PluginValidationList;
    parents: string[];
    model: CmsModel;
    values: TValues;
    fields: CmsModelField[];
    context: CmsContext;
    entry?: CmsEntry<TValues>;
}

const validate = async <TValues extends CmsEntryValues = CmsEntryValues>(
    params: ValidateFieldsParams<TValues>
): Promise<FieldError[]> => {
    const { fields } = params;
    const errors: FieldError[] = [];

    const results = await Promise.all(
        fields.map(async field => {
            return await executeFieldValidation<TValues>({
                ...params,
                field
            });
        })
    );

    for (const result of results) {
        if (result.length === 0) {
            continue;
        }
        errors.push(...result);
    }
    return errors;
};
