import {
    CmsContentModelEntryCreateInputType,
    CmsContentModelEntryUpdateInputType,
    CmsContentModelType,
    CmsContext,
    CmsModelFieldValidatorPlugin
} from "@webiny/api-headless-cms/types";

type ErrorsType = string[];
type EntryType = CmsContentModelEntryCreateInputType | CmsContentModelEntryUpdateInputType;

type ValidatorType = {
    validate: (entry: EntryType, key: string) => Promise<void>;
};
type ValidatorsListType = Map<string, ValidatorType[]>;

const createValidators = async (
    context: CmsContext,
    contentModel: CmsContentModelType
): Promise<ValidatorsListType> => {
    const fieldValidatorPlugins = context.plugins.byType<CmsModelFieldValidatorPlugin>(
        "cms-model-field-validator"
    );
    const { fields } = contentModel;
    const validators = new Map<string, ValidatorType[]>();
    for (const key in fields) {
        if (!fields.hasOwnProperty(key)) {
            continue;
        }
        const field = fields[key];
        const fieldPlugins = fieldValidatorPlugins.filter(pl => pl.validator.name === field.type);
        if (fieldPlugins.length === 0) {
            continue;
        }
        validators.set(
            key,
            (validators.get(key) || []).concat(fieldPlugins.map(pl => pl.validator.validate))
        );
    }
    return validators;
};

export const buildEntryModelValidation = async (
    context: CmsContext,
    contentModel: CmsContentModelType
) => {
    const validatorList = await createValidators(context, contentModel);
    return {
        validate: async (entry: EntryType) => {
            const { values } = entry;

            const errors = new Map<string, ErrorsType>();
            for (const key in values) {
                if (!values.hasOwnProperty(key)) {
                    continue;
                }
                const validators = validatorList.get(key);
                if (!validators) {
                    throw new Error(`There is no validator for field "${key}".`);
                }
                for (const validator of validators) {
                    try {
                        await validator.validate(entry, key);
                    } catch (ex) {
                        errors.set(key, (errors.get(key) || []).concat([ex.message]));
                    }
                }
            }
            return errors.size ? errors : null;
        }
    };
};
