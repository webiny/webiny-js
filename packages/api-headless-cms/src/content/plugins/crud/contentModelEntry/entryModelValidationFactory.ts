import {
    CmsContentModelFieldValidationType,
    CmsContentModelType,
    CmsContext,
    CmsModelFieldValidatorPlugin
} from "@webiny/api-headless-cms/types";

type ValidatorArgsType = {
    value: any;
    validator: CmsContentModelFieldValidationType;
    context: CmsContext;
};
type ValidatorType = {
    validate: (args: ValidatorArgsType) => Promise<boolean>;
};
type ValidatorsListType = Map<string, ValidatorType[]>;

type CreateValidatorsCallableType = (
    context: CmsContext,
    model: CmsContentModelType
) => Promise<ValidatorsListType>;

const createValidators: CreateValidatorsCallableType = async (context, model) => {
    const fieldValidatorPlugins = context.plugins.byType<CmsModelFieldValidatorPlugin>(
        "cms-model-field-validator"
    );
    const { fields } = model;
    const validators = new Map<string, ValidatorType[]>();
    for (let i = 0; i < fields.length; i++) {
        const { validation } = fields[i];
        const fieldValidators = fieldValidatorPlugins
            .filter(pl => validation.find(v => v.name === pl.validator.name))
            .map(pl => pl.validator);

        if (fieldValidators.length === 0) {
            continue;
        }

        validators.set(fields[i].fieldId, fieldValidators);
    }
    return validators;
};

const createFieldValidators = (
    model: CmsContentModelType
): Map<string, CmsContentModelFieldValidationType[]> => {
    const validators = new Map<string, CmsContentModelFieldValidationType[]>();
    for (const { fieldId, validation } of model.fields) {
        validators.set(fieldId, validation);
    }
    return validators;
};

export const entryModelValidationFactory = async (
    context: CmsContext,
    contentModel: CmsContentModelType
) => {
    const validatorList = await createValidators(context, contentModel);
    const fieldValidatorList = createFieldValidators(contentModel);
    return {
        validate: async (data: Record<string, any>): Promise<Record<string, string[]>> => {
            const errors: Record<string, string[]> = {};
            // key of the values is the field we are checking
            for (const field in data) {
                if (!data.hasOwnProperty(field)) {
                    continue;
                }
                const validators = validatorList.get(field);
                if (!validators) {
                    throw new Error(`There is no validator for field "${field}".`);
                }
                const fieldValidators = fieldValidatorList.get(field);
                // if there are no field validators really no point to continue with
                // the code
                // TODO verify that this is correct - maybe some other validators are being run?
                if (!fieldValidators || fieldValidators.length === 0) {
                    continue;
                }
                const value = data[field];
                // TODO is this the right approach?
                for (const fieldValidator of fieldValidators) {
                    for (const validator of validators) {
                        try {
                            await validator.validate({
                                value,
                                validator: fieldValidator,
                                context
                            });
                        } catch (ex) {
                            errors[field] = (errors[field] || []).concat([ex.message]);
                        }
                    }
                }
            }
            return Object.keys(errors).length > 0 ? errors : null;
        }
    };
};
