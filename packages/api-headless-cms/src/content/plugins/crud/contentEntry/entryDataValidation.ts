import {
    CmsContentModel, CmsContentModelField,
    CmsContext,
    CmsModelFieldValidatorPlugin,
    CmsModelFieldValidatorValidateParams
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

type PluginValidationCallable = (params: CmsModelFieldValidatorValidateParams) => Promise<boolean>;
type PluginValidationList = Record<string, PluginValidationCallable[]>;
type InputData = Record<string, any>;

interface ValidateArgs {
    validatorList: PluginValidationList;
    field: CmsContentModelField;
    data: InputData;
    context: CmsContext;
}


const validateMultiple = async(args: ValidateArgs): Promise<string[]> => {
    const {validatorList, field, data, context} = args;
    const value = data[field.fieldId];
    const errors = [];
    
    
    return errors;
};
const validateSingle = async(args: ValidateArgs): Promise<string[]> => {
    const {validatorList, field, data, context} = args;
    const value = data[field.fieldId];
    const errors = [];
    for (const fieldValidator of field.validation) {
        const name = fieldValidator.name;
        /**
         * A list of validations mapped from validator plugins
         * @see CmsModelFieldValidatorPlugin.validator.validate
         */
        const validations = validatorList[name];
        if (!validations || validations.length === 0) {
            throw new WebinyError(`There are no "${name}" validators defined.`);
        }
        for (const validate of validations) {
            try {
                await validate({
                    value,
                    context,
                    validator: fieldValidator,
                })
            } catch(ex) {
                errors.push(fieldValidator.message || ex.message);
            }
        }
    }
    return errors;
};


const runFieldValidation = async (args: ValidateArgs): Promise<string[]> => {
    if (args.field.multipleValues) {
        return await validateMultiple(args);
    }
    return await validateSingle(args);
};

export const validateModelEntryData = async (
    context: CmsContext,
    contentModel: CmsContentModel,
    data: InputData
) => {
    const validatorList: PluginValidationList = context
        .plugins
        .byType<CmsModelFieldValidatorPlugin>("cms-model-field-validator")
        .reduce((acc, plugin) => {
            const name = plugin.validator.name;
            if (!acc[name]) {
                acc[name] = [];
            }
            acc[name].push(plugin.validator.validate);
            
            return acc;
        }, {} as PluginValidationList);

    // Loop through model fields, and validate the corresponding data.
    // Run validation only if the field has validation configured.
    const invalidFields = [];
    for (const field of contentModel.fields) {
        const errors = await runFieldValidation({validatorList, field, data, context});
        if (errors.length === 0) {
            continue;
        }
        invalidFields.push({
            fieldId: field.fieldId,
            errors,
        });
    }

    if (invalidFields.length > 0) {
        throw new WebinyError("Validation failed.", "VALIDATION_FAILED", invalidFields);
    }
};
