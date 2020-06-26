import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, string } from "@webiny/commodo";
import { parse } from "fecha";
import { i18nField } from "./i18nFields";

enum DATE_TYPE {
    DATE_TIME_WITH_TIMEZONE = "dateTimeWithTimezone",
    DATE_TIME_WITHOUT_TIMEZONE = "dateTimeWithoutTimezone",
    DATE = "date",
    TIME = "time"
}

async function validateValue({ value, format, validation, checkLength }) {
    const error = Error(`Enter a string in the following format "${format}"`);
    if (checkLength && format.length !== value.length) {
        throw error;
    }

    const date = parse(value, format);
    if (!date) {
        throw error;
    }

    if (typeof validation === "function") {
        await validation(value);
    }
}

function createValidation({ validation, field, format, checkLength = true }) {
    return async value => {
        if (validation === false) {
            return;
        }

        if (field.multipleValues) {
            // This is the item validation. We still need to have the whole array-level validation.
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    await validateValue({
                        value: value[i],
                        format,
                        validation,
                        checkLength
                    });
                }
            }

            // TODO: execute field-level validation.
            return;
        }

        return validateValue({ value, format, validation, checkLength });
    };
}

function getDateField({ field, validation }) {
    const type: DATE_TYPE = field.settings.type;
    let cField;
    switch (type) {
        case DATE_TYPE.DATE_TIME_WITH_TIMEZONE:
            cField = string({
                validation: createValidation({
                    field,
                    validation,
                    format: "YYYY-MM-DDTHH:mm:ssZ",
                    checkLength: false
                }),
                list: field.multipleValues
            });
            break;
        case DATE_TYPE.DATE_TIME_WITHOUT_TIMEZONE:
            cField = string({
                validation: createValidation({
                    field,
                    validation,
                    format: "YYYY-MM-DD HH:mm:ss"
                }),
                list: field.multipleValues
            });
            break;
        case DATE_TYPE.DATE:
            cField = string({
                validation: createValidation({
                    field,
                    validation,
                    format: "YYYY-MM-DD"
                }),
                list: field.multipleValues
            });
            break;
        case DATE_TYPE.TIME:
            cField = string({
                validation: createValidation({
                    field,
                    validation,
                    format: "HH:mm:ss"
                }),
                list: field.multipleValues
            });
            break;
    }

    return cField;
}

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-datetime",
    type: "cms-model-field-to-commodo-field",
    fieldType: "datetime",
    dataModel({ model, field, validation, context }) {
        withFields({
            [field.fieldId]: i18nField({
                field: getDateField({ field, validation }),
                context
            })
        })(model);
    },
    searchModel({ model, field }) {
        // Searching multiple-value fields is not supported.
        if (field.multipleValues) {
            return;
        }

        withFields({
            [field.fieldId]: getDateField({ field, validation: false })
        })(model);
    },
    createLockedFieldModel({ model }) {
        withFields({
            formatType: string()
        })(model);
    }
};

export default plugin;
